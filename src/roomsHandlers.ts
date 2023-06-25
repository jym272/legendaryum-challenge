import { validRooms } from './create';
import { Socket } from 'socket.io';
import { ClientToServerEvents, Response, ServerToClientsEvents } from '@custom-types/serverTypes';
import errorsMessages from '@custom-types/errors';
const { INVALID_ROOM } = errorsMessages;

export default function () {
  return {
    joinRoom: async function (room: string, callback: (res?: Response<void>) => void) {
      const socket = this as unknown as Socket<ClientToServerEvents, ServerToClientsEvents>;

      if (!validRooms.includes(room)) {
        return callback({ error: INVALID_ROOM });
      }
      await socket.join(room);
      // acknowledge the creation
      callback();
      // entonces el microservicio le devuelve todas las monedas de esa room junto a su posición (x, y, z).
      // socket.emit('room:joined', room);
    }
  };
}
