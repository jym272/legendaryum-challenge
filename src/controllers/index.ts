import { getCoinsController, getCoinController } from '@controllers/coins';
import { getRoomsController, getRoomController } from '@controllers/rooms';
import { getSocketsController, getSocketsInARoomController } from '@controllers/sockets';
export const coinsController = {
  getCoins: getCoinsController(),
  getCoin: getCoinController()
};

export const roomsController = {
  getRooms: getRoomsController(),
  getRoom: getRoomController()
};

export const socketsController = {
  getSockets: getSocketsController(),
  getSocketsInARoom: getSocketsInARoomController()
};
