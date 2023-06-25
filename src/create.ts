import { Server as HttpServer } from 'http';
import { Server, ServerOptions, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ServerConfiguration, SocketData } from '@custom-types/server';
import { getServerConfiguration } from '@utils/index';
import createRoomHandlers from './roomsHandlers';
export let validRooms: string[] = [];
const parseConfig = (configObject: Partial<ServerConfiguration> = {}) => {
  if (!configObject.rooms || configObject.rooms.length === 0) {
    throw new Error('no rooms provided');
  }
  return {
    rooms: configObject.rooms
  };
};

interface Error {
  error: string;
  // errorDetails?: ValidationErrorItem[];
}

interface Success<T> {
  data: T;
}

export type Response<T> = Error | Success<T>;

export interface ServerToClientsEvents {
  rooms: (rooms: string[]) => void;
}

export interface ClientToServerEvents {
  'room:join': (room: string, callback: (res?: Response<void>) => void) => void;
}

export function createApplication(
  httpServer: HttpServer,
  serverOptions: Partial<ServerOptions> = {},
  serverConfiguration: Partial<ServerConfiguration> = {}
): {
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
  rooms: string[];
} {
  const io = new Server<ClientToServerEvents, ServerToClientsEvents, DefaultEventsMap, SocketData>(
    httpServer,
    serverOptions
  );
  // const { createTodo, readTodo, updateTodo, deleteTodo, listTodo } = createTodoHandlers(components);
  // same middleware but, for username in handshake
  const configuration = getServerConfiguration(serverConfiguration);
  validRooms = parseConfig(configuration).rooms;
  io.use((socket: Socket, next) => {
    const username = socket.handshake.auth.username as string | undefined;
    if (!username) {
      return next(new Error('no username provided'));
    }
    next();
  });
  // io.use(async (socket: Socket, next) => {
  //   const room = socket.handshake.auth.room as string | undefined;
  //   if (!room) {
  //     return next(new Error('no room provided'));
  //   }
  //   if (!validRooms.includes(room)) {
  //     return next(new Error('invalid room provided'));
  //   }
  //   // join the room
  //   await socket.join(room); //TODO: testear que el socket se unio al cuarto
  //   next();
  // });

  const { joinRoom } = createRoomHandlers();

  io.on('connection', socket => {
    // persist session

    // first emit all the rooms ava
    socket.emit('rooms', validRooms);
    // it the client join a room, it must be in the list of valid rooms
    socket.on('room:join', joinRoom);
  });

  return {
    io,
    rooms: validRooms
  };
}
