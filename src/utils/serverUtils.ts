import fs from 'fs';
import { getEnvOrFail, serverConfigurationParser } from '@utils/index';
import { Coin, Room, ServerConfiguration } from '@custom-types/index';
import errors from '@custom-types/errors';
const { ROOMS_WITH_SAME_NAME, READING_SERVER_CONFIG_FILE, MAX_AMOUNT_COINS, PARSING_SERVER_CONFIG_FILE } = errors;
// TODO: refactorizar en una clase build design pattern

const checkUniqueRoomNames = (configuration: ServerConfiguration) => {
  const names = configuration.rooms.map(room => room.name);
  const uniqueNames = [...new Set(names)];
  if (names.length !== uniqueNames.length) {
    throw new Error(ROOMS_WITH_SAME_NAME);
  }
};
export const getServerConfiguration = (configObject: Partial<ServerConfiguration> = {}) => {
  let serverConfiguration;
  if (configObject.rooms && configObject.rooms.length > 0) {
    serverConfiguration = configObject as ServerConfiguration;
  } else {
    const configFile = getEnvOrFail('CONFIG_SERVER_FILE');
    let configData: string;
    try {
      configData = fs.readFileSync(configFile, 'utf-8');
    } catch (error) {
      throw new Error(READING_SERVER_CONFIG_FILE);
    }
    serverConfiguration = serverConfigurationParser(configData);
    if (serverConfiguration === undefined) {
      const error = `${PARSING_SERVER_CONFIG_FILE} ${serverConfigurationParser.message ?? ''}`;
      throw new Error(error);
    }
  }

  checkUniqueRoomNames(serverConfiguration);

  return serverConfiguration;
};
// TODO: maybe generator folder
// isMaxAmountOfCoinsReached for a room
const maximumNumberOfPossibleCoins = (room: Room) => {
  const { x, y, z } = room.area;
  return (x.max - x.min + 1) * (y.max - y.min + 1) * (z.max - z.min + 1);
};
export const generateCoins = (configuration: ServerConfiguration) => {
  configuration.rooms.forEach(room => {
    const { amountOfCoins } = room;

    if (maximumNumberOfPossibleCoins(room) < amountOfCoins) {
      throw new Error(MAX_AMOUNT_COINS);
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
