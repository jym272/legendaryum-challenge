import { Server as HttpServer } from 'http';
import { Server, ServerOptions, Socket } from 'socket.io';
import { log } from '@utils/logs';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ServerConfiguration, SocketData } from '@custom-types/server';
import { getServerConfiguration } from '@utils/server';

const parseConfig = (configObject: Partial<ServerConfiguration> = {}) => {
  if (!configObject.rooms || configObject.rooms.length === 0) {
    throw new Error('config_server.json is not valid');
  }
  return {
    rooms: configObject.rooms
  };
};

export function createApplication(
  httpServer: HttpServer,
  serverOptions: Partial<ServerOptions> = {},
  serverConfiguration: Partial<ServerConfiguration> = {}
): {
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
  rooms: string[];
} {
  const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(httpServer, serverOptions);
  // const { createTodo, readTodo, updateTodo, deleteTodo, listTodo } = createTodoHandlers(components);
  // same middleware but, for username in handshake
  const configuration = getServerConfiguration(serverConfiguration);
  const { rooms: validRooms } = parseConfig(configuration);
  io.use((socket: Socket, next) => {
    const username = socket.handshake.auth.username as string | undefined;
    if (!username) {
      return next(new Error('no username provided'));
    }
    next();
  });
  io.use(async (socket: Socket, next) => {
    const room = socket.handshake.auth.room as string | undefined;
    if (!room) {
      return next(new Error('no room provided'));
    }
    if (!validRooms.includes(room)) {
      return next(new Error('invalid room provided'));
    }
    // join the room
    await socket.join(room);
    next();
  });

  io.on('connection', socket => {
    // persist session

    socket.on('todo:create', () => {
      log('todo:create');
    });
    log('CONNECTION');
  });

  return {
    io,
    rooms: validRooms
  };
}
