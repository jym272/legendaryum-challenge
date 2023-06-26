import { configuration, validRooms } from './create';
import { Socket } from 'socket.io';
import { ClientToServerEvents, Response, ServerToClientsEvents } from '@custom-types/serverTypes';
import errorsMessages from '@custom-types/errors';
import { log } from '@utils/logs';
const { INVALID_ROOM, COIN_NOT_FOUND } = errorsMessages;

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

    grabCoin: function (coinID: number, callback: (res?: Response<void>) => void) {
      const socket = this as unknown as Socket<ClientToServerEvents, ServerToClientsEvents>;
      log('ROOMS', socket.rooms);
      const room = Object.keys(socket.rooms)[1];
      const coin = configuration.rooms.find(r => r.name === room)?.coins?.find(c => c.id === coinID);
      if (!coin) {
        return callback({ error: COIN_NOT_FOUND });
      }
      if (!coin.isAvailable) {
        return callback({ error: 'Coin already grabbed' });
      }
      coin.isAvailable = false;
      callback();
      socket.to(room).emit('coin:grabbed', coinID);
    }
  };
}
