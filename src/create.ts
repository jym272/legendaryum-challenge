import { Server as HttpServer } from 'http';
import { Server, ServerOptions, Socket } from 'socket.io';
import { log } from '@utils/logs';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

interface SocketData {
  sessionID: string;
  userID: string;
  username: string;
}
const validRooms = ['room1', 'room2', 'room3', 'cool_room'];

export function createApplication(
  httpServer: HttpServer,
  serverOptions: Partial<ServerOptions> = {}
): Server<DefaultEventsMap, DefaultEventsMap> {
  const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(httpServer, serverOptions);

  // const { createTodo, readTodo, updateTodo, deleteTodo, listTodo } = createTodoHandlers(components);
  io.use(async (socket: Socket, next) => {
    const room = socket.handshake.auth.room as string | undefined;
    if (!room) {
      return next(new Error('no room provided'));
    }
    if (!validRooms.includes(room)) {
      return next(new Error('invalid room'));
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

  return io;
}
