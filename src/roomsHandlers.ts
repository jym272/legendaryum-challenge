import { Socket } from 'socket.io';
import { ClientToServerEvents, Coin, Response, RoomName, ServerToClientsEvents, SocketData } from '@custom-types/index';
import errorsMessages from '@custom-types/errors';
import { getServerStore, getSessionStore } from './redis';
import { log } from '@utils/logs';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
const { ROOM_DOESNT_HAVE_COINS, SOCKET_NOT_IN_ROOM, COIN_NOT_AVAILABLE, INVALID_ROOM, COIN_NOT_FOUND } = errorsMessages;

type SocketIO = Socket<ClientToServerEvents, ServerToClientsEvents, DefaultEventsMap, SocketData>;
export default function () {
  return {
    joinRoom: async function (room: string, callback: (res?: Response<Coin[]>) => void) {
      const socket = this as unknown as SocketIO;
      const serverStore = getServerStore();
      const sessionStore = getSessionStore();

      const rooms = await serverStore.getRoomNames();

      if (!rooms.includes(room)) {
        return callback({ error: INVALID_ROOM });
      }
      await socket.join(room); // TODO: testear si me queiero unir dos veces al mismo cuarto

      const coins = await serverStore.getCoinsByRoomName(room);
      if (coins.length === 0) {
        return callback({ error: ROOM_DOESNT_HAVE_COINS }); // TODO: no testeado, de seguro con redis cambia algo, limite al menos 1 coin??
      }
      await sessionStore.addRoomToSession(socket.data.sessionID, room);
      callback({
        data: coins
      });
    },

    grabCoin: async function (
      { coinID, room: roomName }: { coinID: number; room: RoomName },
      callback: (res?: Response<void>) => void
    ) {
      const socket = this as unknown as Socket<ClientToServerEvents, ServerToClientsEvents>;
      const serverStore = getServerStore();
      if (!socket.rooms.has(roomName)) {
        return callback({ error: SOCKET_NOT_IN_ROOM });
      }
      const coin = await serverStore.getCoin(roomName, coinID);
      log('coin', coin, socket.id);

      if (!coin) {
        return callback({ error: COIN_NOT_FOUND });
      }
      if (!coin.isAvailable) {
        return callback({ error: COIN_NOT_AVAILABLE });
      }
      await serverStore.grabCoin(roomName, coinID); // TODO: socket.data.username or
      // socket.data.sessionID -> to know who grabbed the coin
      // coin.isAvailable = false; //what!!!!
      callback();
      socket.to(roomName).emit('coin:grabbed', { coinID, room: roomName });
    }
  };
}
