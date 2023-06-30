import { Server as HttpServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import {
  ClientToServerEvents,
  ServerConfiguration,
  ServerIo,
  ServerToClientsEvents,
  SocketData
} from '@custom-types/index';
import { generateCoins, getServerConfiguration, log } from '@utils/index';
import createRoomHandlers from './roomsHandlers';
import { getServerStore, getSessionStore } from './redis';
import * as crypto from 'crypto';
import errors from '@custom-types/errors';
const { NO_USERNAME_PROVIDED } = errors;

function randomId(): string {
  return crypto.randomBytes(8).toString('hex');
}

let io: ServerIo | undefined;

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket server not initialized'); //TODO test! cuando testee socket api
  }
  return io;
};

const addMiddlewares = (io: ServerIo) => {
  io.use(async (socket, next) => {
    // El cliente envía unsa session, significa que ya se conecto antes y envio la sessio que se le envio
    // si es que tengo la session ya tengo un username y un userID
    const sessionID = socket.handshake.auth.sessionID as string | undefined;
    if (sessionID) {
      const session = await getSessionStore().findSession(sessionID);
      if (session) {
        socket.data.sessionID = sessionID;
        socket.data.userID = session.userID;
        socket.data.username = session.username;
        return next();
      }
    }
    const username = socket.handshake.auth.username as string | undefined;

    if (!username) {
      return next(new Error(NO_USERNAME_PROVIDED));
    }
    socket.data.sessionID = randomId();
    socket.data.userID = randomId();
    socket.data.username = username;
    next();
  });
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
    // TODO: borrar toda la base de datos primero!, realizar un flush!!!
    await serverStore.saveConfiguration(configuration); // the configuration saved is withoi the coins
    generateCoins(configuration);
    await serverStore.saveServerConfiguration(configuration); // it will save coins also, order is important
    // log('New server configuration, saving it to Redis');
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

  await setUpServerConfiguration(serverConfiguration);

  addMiddlewares(io);

  const { joinRoom, grabCoin } = createRoomHandlers();

  io.on('connection', async socket => {
    socket.on('room:join', joinRoom);
    socket.on('coin:grab', grabCoin);
    const sessionStore = getSessionStore();
    await sessionStore.saveSession(socket.data.sessionID, {
      userID: socket.data.userID,
      username: socket.data.username,
      connected: true
    });
    void socket.join(socket.data.userID);

    socket.emit('session', {
      sessionID: socket.data.sessionID,
      userID: socket.data.userID
    });

    const rooms = await getServerStore().getAllRooms();
    socket.emit('rooms', rooms);

    const restoreSessionRooms = await sessionStore.getRoomsWithCoins(socket.data.sessionID);
    if (restoreSessionRooms.length > 0) {
      restoreSessionRooms.forEach(({ name }) => {
        void socket.join(name);
      });
      socket.emit('session:rejoinRooms', restoreSessionRooms);
    }

    socket.on('disconnect', async () => {
      const matchingSockets = await io?.in(socket.data.userID).fetchSockets();
      const isDisconnected = matchingSockets !== undefined && matchingSockets.length === 0;
      if (isDisconnected) {
        await sessionStore.saveSession(socket.data.sessionID, {
          userID: socket.data.userID,
          username: socket.data.username,
          connected: false
        });
      }
    });
  });

  io.on('error', err => {
    log('Error', err);
  });
  // io disconnect
  io.on('disconnect', () => {
    log('disconnect');
  });

  //
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
