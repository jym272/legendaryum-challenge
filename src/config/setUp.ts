import { ServerConfiguration } from '@custom-types/serverTypes';
import { serverConfigurationParser } from '@utils/JSONTypeDefinition';
import { getEnvOrFail } from '@utils/env';
import fs from 'fs';
import { serverConfigurationValidateSchema } from '@utils/JSONSchema';
import { Coin, Room } from '@custom-types/appTypes';
import { getServerStore } from '@redis/serverStore';
import { getRedisClient } from '../setup';
import { log } from '@utils/logs';

import errors from '@custom-types/errors';
const {
  ROOMS_WITH_SAME_NAME,
  READING_SERVER_CONFIG_FILE,
  SCHEMA_NOT_VALID,
  MAX_AMOUNT_COINS,
  PARSING_SERVER_CONFIG_FILE
} = errors;

export class SetUp {
  isReadFromFile = false;
  serverConfiguration: ServerConfiguration;

  constructor(configuration: Partial<ServerConfiguration>) {
    this.serverConfiguration = this.checkObjectConfiguration(configuration);
  }

  parseConfigurationFile(configData: string) {
    const serverConfiguration = serverConfigurationParser(configData);
    if (serverConfiguration === undefined) {
      const error = `${PARSING_SERVER_CONFIG_FILE} ${serverConfigurationParser.message ?? ''}`;
      throw new Error(error);
    }
    return serverConfiguration;
  }

  checkObjectConfiguration(configuration: Partial<ServerConfiguration>) {
    let serverConfiguration;
    if (configuration.rooms && configuration.rooms.length > 0) {
      serverConfiguration = configuration as ServerConfiguration;
    } else {
      const configFile = getEnvOrFail('CONFIG_SERVER_FILE');
      let configData: string;
      try {
        configData = fs.readFileSync(configFile, 'utf-8');
      } catch (error) {
        throw new Error(READING_SERVER_CONFIG_FILE);
      }
      serverConfiguration = this.parseConfigurationFile(configData);
      this.isReadFromFile = true;
    }
    return serverConfiguration;
  }

  checkUniqueRoomNames() {
    const names = this.serverConfiguration.rooms.map(room => room.name);
    const uniqueNames = [...new Set(names)];
    if (names.length !== uniqueNames.length) {
      throw new Error(ROOMS_WITH_SAME_NAME);
    }
    return this;
  }

  validateConfiguration() {
    if (!serverConfigurationValidateSchema(this.serverConfiguration)) {
      throw new Error(SCHEMA_NOT_VALID + JSON.stringify(serverConfigurationValidateSchema.errors));
    }
    return this;
  }

  maximumNumberOfPossibleCoins(room: Room) {
    const { x, y, z } = room.area;
    return (x.max - x.min + 1) * (y.max - y.min + 1) * (z.max - z.min + 1);
  }
  generateCoins() {
    this.serverConfiguration.rooms.forEach(room => {
      const { amountOfCoins } = room;

      if (this.maximumNumberOfPossibleCoins(room) < amountOfCoins) {
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
  }

  async storeConfiguration() {
    const serverStore = getServerStore();
    const storedConfiguration = await serverStore.getServerConfiguration();
    if (!storedConfiguration || storedConfiguration !== JSON.stringify(this.serverConfiguration)) {
      await getRedisClient().flushall();
      // the configuration saved is without the coins
      await serverStore.saveConfiguration(this.serverConfiguration);
      this.generateCoins();
      // it will save coins also, order is important
      await serverStore.persistNewConfiguration(this.serverConfiguration);
      log('New server configuration, saving it to Redis');
      return;
    }
    log('Server configuration already stored in Redis');
  }

  async build() {
    await this.validateConfiguration().checkUniqueRoomNames().storeConfiguration();
  }
}
