import { Server as HttpServer } from 'http';
import { Server, ServerOptions, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { ClientToServerEvents, ServerConfiguration, ServerToClientsEvents, SocketData } from '@custom-types/index';
import { generateCoins, getNameOfTheRooms, getServerConfiguration } from '@utils/index';
import createRoomHandlers from './roomsHandlers';
export let validRooms: string[] = [];
export let configuration: ServerConfiguration = { rooms: [] };

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

  configuration = getServerConfiguration(serverConfiguration);
  validRooms = getNameOfTheRooms(configuration);
  generateCoins(configuration);
  // TODO: generar las monedas en cada cuarto!!, por ahora todo en memoria, luego en REDIS
  io.use((socket: Socket, next) => {
    const username = socket.handshake.auth.username as string | undefined;
    if (!username) {
      return next(new Error('no username provided'));
    }
    next();
  });

  const { joinRoom, grabCoin } = createRoomHandlers();

  io.on('connection', socket => {
    socket.emit('rooms', validRooms);
    socket.on('room:join', joinRoom); //TODO: testear que el socket se unio al cuarto
    socket.on('coin:grab', grabCoin);
    // listen all events
    // socket.onAny((event, ...args) => {
    //   console.log(event, args);
    // });
  });
  // io.of('/').adapter.on('create-room', room => {
  //   log(`room ${room as string} was created`);
  // });
  //
  // io.of('/').adapter.on('join-room', (room, id) => {
  //   log(`socket ${id as string} has joined room ${room as string}`);
  // });

  return {
    io,
    rooms: validRooms
  };
}
