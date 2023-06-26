import { getCoinsController, getCoinController } from '@controllers/coins';
import { getRoomsController, getRoomController } from '@controllers/rooms';

export const coinsController = {
  getCoins: getCoinsController(),
  getCoin: getCoinController()
};

export const roomsController = {
  getRooms: getRoomsController(),
  getRoom: getRoomController()
};
