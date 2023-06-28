import { Server as HttpServer } from 'http';
import { Server, ServerOptions, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ClientToServerEvents, ServerConfiguration, ServerToClientsEvents, SocketData } from '@custom-types/index';
import { generateCoins, getServerConfiguration, log } from '@utils/index';
import createRoomHandlers from './roomsHandlers';
import { getServerStore } from './redis';

// export let configuration: ServerConfiguration = { rooms: [] };

// function randomId(): string {
//   return crypto.randomBytes(8).toString('hex');
// }

type ServerIo = Server<ClientToServerEvents, ServerToClientsEvents, DefaultEventsMap, SocketData>;

let io: ServerIo | undefined;

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket server not initialized');
  }
  return io;
};

const addMiddlewares = (io: ServerIo) => {
  io.use((socket: Socket, next) => {
    const username = socket.handshake.auth.username as string | undefined;
    if (!username) {
      return next(new Error('no username provided'));
    }
    next();
  });

  // io.use(async (socket, next) => {
  //   //sessionID is in the client browser, or something
  //   // TODO: con sessionId podemos reconectarlo en los cuartos en los cuales estaba conectada
  //   const sessionID = socket.handshake.auth.sessionID as string | undefined;
  //   if (sessionID) {
  //     const session = await getSessionStore().findSession(sessionID);
  //     if (session) {
  //       socket.data.sessionID = sessionID;
  //       socket.data.userID = session.userID;
  //       socket.data.username = session.username;
  //       return next();
  //     }
  //   }
  //   const username = socket.handshake.auth.username as string | undefined;
  //
  //   if (!username) {
  //     return next(new Error('no username provided'));
  //   }
  //   socket.data.sessionID = randomId();
  //   socket.data.userID = randomId();
  //   socket.data.username = username;
  //   next();
  // });

  return io;
};

const setUpServerConfiguration = async (serverConfiguration: Partial<ServerConfiguration> = {}) => {
  // if there is already a server config in db, thats okey, create a env var to force to rebuild the server configuration
  // better name like build TODO, only if the env var is provided or if there is not a server configuration in db
  const configuration = getServerConfiguration(serverConfiguration);
  const serverStore = getServerStore();

  // not anymore validRooom, the query must be done in redisDB TODO: NOW
  // // later refactor this funciton in a patter design like a build TOD
  // await storeConfiguration(configuration);

  // TODO: testear estos flujos
  const storedConfiguration = await serverStore.getServerConfiguration();
  if (!storedConfiguration || storedConfiguration !== JSON.stringify(configuration)) {
    log('New server configuration, saving it to Redis');
    // TODO: borrar toda la base de datos primero!, realizar un flush!!!
    await serverStore.saveConfiguration(configuration); // the configuration saved is withoi the coins
    generateCoins(configuration);
    await serverStore.saveServerConfiguration(configuration); // it will save coins also, order is important
    return;
  }
  log('Server configuration already stored in Redis');
};

export async function createApplication(
  httpServer: HttpServer,
  serverOptions: Partial<ServerOptions> = {},
  serverConfiguration: Partial<ServerConfiguration> = {}
) {
  io = new Server<ClientToServerEvents, ServerToClientsEvents, DefaultEventsMap, SocketData>(httpServer, serverOptions);

  // validRooms = getNameOfTheRooms(configuration);
  await setUpServerConfiguration(serverConfiguration);

  addMiddlewares(io);

  const { joinRoom, grabCoin } = createRoomHandlers();

  io.on('connection', async socket => {
    const rooms = await getServerStore().getRoomNames();
    socket.emit('rooms', rooms);
    socket.on('room:join', joinRoom); //TODO: testear que el socket se unio al cuarto
    socket.on('coin:grab', grabCoin);
    // listen all events
    // socket.onAny((event, ...args) => {
    //   console.log(event, args);
    // });
    // socket.on("disconnect", async () => {
    //   const sockets = await io.in(userId).fetchSockets();
    //   if (socket.length === 0) {
    //     // no more active connections for the given user
    //   }
    // });

    // sessionStore.saveSession(socket.data.sessionID, {
    //   userID: socket.data.userID,
    //   username: socket.data.username,
    //   connected: true
    // });
    //
    // // emit session details
    // socket.emit('session', {
    //   sessionID: socket.data.sessionID,
    //   userID: socket.data.userID
    // });

    // join the "userID" room
    // void socket.join(socket.data.userID);

    // forward the private message to the right recipient (and to other tabs of the sender)
    // socket.on('private message', ({ content, to }) => {
    //   const message: Message = {
    //     content,
    //     from: socket.data.userID,
    //     to
    //   };
    //   socket.to(to).to(socket.data.userID).emit('private message', message);
    //   messageStore.saveMessage(message);
    // });

    // notify users upon disconnection
    // socket.on('disconnect', async () => {
    //   const matchingSockets = await io.in(socket.data.userID).allSockets();
    //   const isDisconnected = matchingSockets.size === 0;
    //   if (isDisconnected) {
    //     // notify other users
    //     socket.broadcast.emit('user disconnected', socket.data.userID);
    //     // update the connection status of the session
    //     sessionStore.saveSession(socket.data.sessionID, {
    //       userID: socket.data.userID,
    //       username: socket.data.username,
    //       connected: false
    //     });
    //   }
    // });
  });
  // io.of('/').adapter.on('create-room', room => {
  //   log(`room ${room as string} was created`);
  // });
  //
  // io.of('/').adapter.on('join-room', async (room, id) => {
  //   log(`socket ${id as string} has joined room ${room as string}`);
  //   // return all Socket instances of the main namespace
  //   const sockets = await io.fetchSockets();
  //   log(sockets); // 1
  // });

  return {
    io
  };
}
