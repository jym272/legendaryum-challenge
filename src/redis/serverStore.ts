import Redis from 'ioredis';
import { Coin, Room, RoomName, ServerConfiguration } from '@custom-types/serverTypes';
import { getRedisClient } from '../setup';

class ServerStore {
  private redis: Redis;

  constructor(redis: Redis) {
    // Connect to Redis
    this.redis = redis;
  }

  async saveConfiguration(config: ServerConfiguration): Promise<void> {
    // Save server configuration
    await this.redis.set('server:config', JSON.stringify(config));
  }

  async getServerConfiguration(): Promise<string | null> {
    return this.redis.get('server:config');
  }

  // async getConfiguration(): Promise<ServerConfiguration | null> {
  //   // Retrieve server configuration
  //   const configString = await this.redis.get('server:config');
  //   if (configString) {
  //     return JSON.parse(configString);
  //   }
  //   return null;
  // }

  async saveServerConfiguration(config: ServerConfiguration) {
    const pipeline = this.redis.pipeline();

    // Save each room and its coins
    for (const room of config.rooms) {
      const { name, area, amountOfCoins, coins } = room;

      // Save the room details
      pipeline.hmset(
        `room:${name}`,
        'area',
        JSON.stringify(area),
        'amountOfCoins',
        amountOfCoins.toString(),
        'name',
        name
      );
      //Save name of rooms in a set rooms
      pipeline.sadd('rooms', `room:${name}`);

      if (coins) {
        // TODO: the coins must be generated, throw an error
        // Save the coins in the room
        for (const coin of coins) {
          pipeline.hmset(
            `coin:${name}:${coin.id}`,
            'position',
            JSON.stringify(coin.position),
            'isAvailable',
            coin.isAvailable.toString(),
            'id',
            coin.id.toString()
          );
          pipeline.sadd(`room:${name}:coins`, `coin:${name}:${coin.id}`);
        }
      }
    }

    // Execute the pipeline
    await pipeline.exec();
  }

  async getCoinsByRoomName(roomName: RoomName): Promise<Coin[]> {
    const coinKeys = await this.redis.smembers(`room:${roomName}:coins`);

    const pipeline = this.redis.pipeline();
    for (const coinKey of coinKeys) {
      pipeline.hgetall(coinKey);
    }

    const coinData = await pipeline.exec();
    if (!coinData) return [];

    const data = coinData as [Error | null, Record<string, string>][];
    return data
      .map(([error, coin]) =>
        error
          ? undefined
          : {
              id: Number(coin.id),
              position: JSON.parse(coin.position) as Coin['position'],
              isAvailable: Boolean(coin.isAvailable)
            }
      )
      .filter(Boolean) as Coin[];
  }

  async getCoin(roomName: RoomName, coinId: number): Promise<Coin | null> {
    const key = `coin:${roomName}:${coinId}`;
    const coinString = await this.redis.hgetall(key);
    if (!Object.keys(coinString).length) return null;
    return {
      id: Number(coinString.id),
      position: JSON.parse(coinString.position) as Coin['position'],
      isAvailable: coinString.isAvailable === 'true'
    };
  }

  async getRoomNames(): Promise<RoomName[]> {
    const roomNames = await this.redis.smembers('rooms');
    return roomNames.map(roomName => roomName.replace(/^room:/, ''));
  }

  async grabCoin(roomName: RoomName, coinId: number): Promise<void> {
    const key = `coin:${roomName}:${coinId}`;
    await this.redis.hset(key, 'isAvailable', 'false');
  }
  async getRoom(roomName: RoomName): Promise<Room | null> {
    const room = await this.redis.hgetall(`room:${roomName}`);
    if (Object.keys(room).length) {
      return {
        name: room.name,
        area: JSON.parse(room.area) as Room['area'],
        amountOfCoins: Number(room.amountOfCoins)
      };
    }
    return null;
  }
  async getAllRooms(): Promise<Room[]> {
    const roomNames = await this.redis.smembers('rooms');
    const pipeline = this.redis.pipeline();

    for (const roomName of roomNames) {
      pipeline.hgetall(roomName);
    }

    const results = await pipeline.exec();

    if (!results) return [];

    const data = results as [Error | null, Record<string, string>][];

    return data
      .map(([error, room]) =>
        error
          ? undefined
          : {
              name: room.name,
              area: JSON.parse(room.area) as Room['area'],
              amountOfCoins: Number(room.amountOfCoins)
            }
      )
      .filter(Boolean) as Room[];
  }
}

let serverStore: ServerStore | null = null;

export const getServerStore = () => {
  if (!serverStore) {
    serverStore = new ServerStore(getRedisClient());
  }
  return serverStore;
};
