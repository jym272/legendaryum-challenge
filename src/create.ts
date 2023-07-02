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
import createHandlers from '@sockets/handlers';
import { getServerStore, getSessionStore } from './redis';
import errors from '@custom-types/errors';
const { SOCKET_SERVER_NOT_INITIALIZED } = errors;
import { Setup } from '@config/setup';
import { addMiddlewares } from '@sockets/middlewares';

let io: ServerIo | undefined;

export const getSocketServer = () => {
  if (!io) {
    throw new Error(SOCKET_SERVER_NOT_INITIALIZED);
  }
  return io;
};

export async function createApplication(
  httpServer: HttpServer,
  serverOptions: Partial<ServerOptions> = {},
  serverConfiguration: Partial<ServerConfiguration> = {}
) {
  const { joinRoom, grabCoin } = createHandlers();
  await new Setup(serverConfiguration).build();

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
