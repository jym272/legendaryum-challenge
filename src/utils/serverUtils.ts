import fs from 'fs';
import { getEnvOrFail } from '@utils/env';
import { Coin, Room, ServerConfiguration } from '@custom-types/index';
import errors from '@custom-types/errors';
const { CONFIG_FILE_ERROR, MAX_AMOUNT_COINS_ERROR } = errors;
// TODO: refactorizar en una clase build design pattern

export const getServerConfiguration = (configObject: Partial<ServerConfiguration> = {}) => {
  if (configObject.rooms && configObject.rooms.length > 0) {
    return configObject as ServerConfiguration;
  }
  const configFile = getEnvOrFail('CONFIG_SERVER_FILE');
  try {
    const configData = fs.readFileSync(configFile, 'utf-8');
    return JSON.parse(configData) as ServerConfiguration;
  } catch (error) {
    throw new Error(CONFIG_FILE_ERROR);
  }
};
// TODO: maybe generator folder
export const getNameOfTheRooms = (configuration: ServerConfiguration) => {
  return configuration.rooms.map(room => room.name);
};
// isMaxAmountOfCoinsReached for a room
const maximumNumberOfPossibleCoins = (room: Room) => {
  const { x, y, z } = room.area;
  return (x.max - x.min + 1) * (y.max - y.min + 1) * (z.max - z.min + 1);
};
export const generateCoins = (configuration: ServerConfiguration) => {
  configuration.rooms.forEach(room => {
    const { amountOfCoins } = room;

    if (maximumNumberOfPossibleCoins(room) < amountOfCoins) {
      throw new Error(MAX_AMOUNT_COINS_ERROR); //TODO, testear
    }

    const coins: Coin[] = [];
    const generatedPositions = new Map<string, boolean>(); // Map to track generated positions

    let uniquePosition = false;
    let coinPosition = { x: 0, y: 0, z: 0 };

    for (let i = 0; i < amountOfCoins; i++) {
      uniquePosition = false;
      while (!uniquePosition) {
        coinPosition = {
          x: Math.floor(Math.random() * (room.area.x.max - room.area.x.min + 1) + room.area.x.min),
          y: Math.floor(Math.random() * (room.area.y.max - room.area.y.min + 1) + room.area.y.min),
          z: Math.floor(Math.random() * (room.area.z.max - room.area.z.min + 1) + room.area.z.min)
        };

        const positionHash = `${coinPosition.x}-${coinPosition.y}-${coinPosition.z}`;
        if (!generatedPositions.has(positionHash)) {
          uniquePosition = true;
          generatedPositions.set(positionHash, true);
        }
      }

      const coin = {
        id: i,
        position: coinPosition,
        isAvailable: true
      };
      coins.push(coin);
    }
    room.coins = coins;
  });
};
