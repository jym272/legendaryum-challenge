import { configuration, validRooms } from './create';
import { Socket } from 'socket.io';
import { ClientToServerEvents, Response, RoomName, ServerToClientsEvents } from '@custom-types/serverTypes';
import errorsMessages from '@custom-types/errors';
const { SOCKET_NOT_IN_ROOM, COIN_NOT_AVAILABLE, INVALID_ROOM, COIN_NOT_FOUND } = errorsMessages;

export default function () {
  return {
    joinRoom: async function (room: string, callback: (res?: Response<void>) => void) {
      const socket = this as unknown as Socket<ClientToServerEvents, ServerToClientsEvents>;

      if (!validRooms.includes(room)) {
        return callback({ error: INVALID_ROOM });
      }
      await socket.join(room);

      const coins = configuration.rooms.find(r => r.name === room)?.coins;
      if (!coins) {
        return callback({ error: "Room doesn't have coins" }); // TODO: no testeado, de seguro con redis cambia
      }
      callback();

      // TODO: maybe a better name is needed, for the event, like coins:added
      socket.emit('room:joined', coins);
    },

    grabCoin: function (
      { coinID, room: roomName }: { coinID: number; room: RoomName },
      callback: (res?: Response<void>) => void
    ) {
      const socket = this as unknown as Socket<ClientToServerEvents, ServerToClientsEvents>;

      if (!socket.rooms.has(roomName)) {
        return callback({ error: SOCKET_NOT_IN_ROOM });
      }
      const coin = configuration.rooms.find(r => r.name === roomName)?.coins?.find(c => c.id === coinID);
      if (!coin) {
        return callback({ error: COIN_NOT_FOUND });
      }
      if (!coin.isAvailable) {
        return callback({ error: COIN_NOT_AVAILABLE });
      }
      coin.isAvailable = false;
      callback();
      socket.to(roomName).emit('coin:grabbed', { coinID, room: roomName });
    }
  };
}
