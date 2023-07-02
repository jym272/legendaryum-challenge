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
import { log } from '@utils/index';
import createRoomHandlers from './roomsHandlers';
import { getServerStore, getSessionStore } from './redis';
import * as crypto from 'crypto';
import errors from '@custom-types/errors';
const { NO_USERNAME_PROVIDED, SOCKET_SERVER_NOT_INITIALIZED } = errors;
import { SetUp } from './config/setUp';

function randomId(): string {
  return crypto.randomBytes(8).toString('hex');
}

let io: ServerIo | undefined;

export const getSocketServer = () => {
  if (!io) {
    throw new Error(SOCKET_SERVER_NOT_INITIALIZED);
  }
  return io;
};

const addMiddlewares = (io: ServerIo) => {
  io.use(async (socket, next) => {
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

export async function createApplication(
  httpServer: HttpServer,
  serverOptions: Partial<ServerOptions> = {},
  serverConfiguration: Partial<ServerConfiguration> = {}
) {
  const { joinRoom, grabCoin } = createRoomHandlers();
  // await setUpServerConfiguration(serverConfiguration);

  // const app = new SetUpServer(serverConfiguration);
  await new SetUp(serverConfiguration).build();

  io = new Server<ClientToServerEvents, ServerToClientsEvents, DefaultEventsMap, SocketData>(httpServer, serverOptions);
  addMiddlewares(io);

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

  return {
    io
  };
}
