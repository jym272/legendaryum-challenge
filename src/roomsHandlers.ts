import { ClientToServerEvents, Response, ServerToClientsEvents, validRooms } from './create';
import { Socket } from 'socket.io';

export default function () {
  return {
    joinRoom: async function (room: string, callback: (res?: Response<void>) => void) {
      const socket: Socket<ClientToServerEvents, ServerToClientsEvents> = this as unknown as Socket<
        ClientToServerEvents,
        ServerToClientsEvents
      >;

      if (!validRooms.includes(room)) {
        return callback({ error: 'invalid room provided' });
      }
      await socket.join(room);
      // acknowledge the creation
      callback();
      // socket.emit('room:joined', room);
    }
  };
}
