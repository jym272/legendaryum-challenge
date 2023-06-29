import { RoomName } from '@custom-types/serverTypes';

export interface Coin {
  id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  isAvailable: boolean;
}

export interface Room {
  name: RoomName;
  area: {
    x: {
      max: number;
      min: number;
    };
    y: {
      max: number;
      min: number;
    };
    z: {
      max: number;
      min: number;
    };
  };
  amountOfCoins: number;
  coins?: Coin[];
}

export interface RoomWithRequiredCoins extends Room {
  coins: Coin[];
}
