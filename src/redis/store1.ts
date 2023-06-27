/*
import Redis from 'ioredis';
import { Coin, Room, RoomName, ServerConfiguration } from './types';

class ServerStore {
  private redis: Redis.Redis;

  constructor() {
    // Connect to Redis
    this.redis = new Redis();
  }

  async saveServerConfiguration(config: ServerConfiguration): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Save each room and its coins
    for (const room of config.rooms) {
      const { name, area, amountOfCoins, coins } = room;

      // Save the room details
      pipeline.hmset(`room:${name}`, 'area', JSON.stringify(area), 'amountOfCoins', amountOfCoins.toString());

      if (coins) {
        // Save the coins in the room
        for (const coin of coins) {
          pipeline.hmset(`coin:${coin.id}`, 'position', JSON.stringify(coin.position), 'isAvailable', coin.isAvailable.toString());
          pipeline.sadd(`room:${name}:coins`, coin.id.toString());
        }
      }
    }

    // Execute the pipeline
    await pipeline.exec();
  }

  async getServerConfiguration(): Promise<ServerConfiguration> {
    const roomKeys = await this.redis.keys('room:*');
    const pipeline = this.redis.pipeline();

    for (const roomKey of roomKeys) {
      const roomName = roomKey.substring(5); // Remove the 'room:' prefix
      pipeline.hgetall(roomKey);
      pipeline.smembers(`room:${roomName}:coins`);
    }

    const results = await pipeline.exec();
    const config: ServerConfiguration = {
      rooms: []
    };

    for (let i = 0; i < results.length; i += 2) {
      const roomData = results[i][1];
      const coinIds = results[i + 1][1];

      const room: Room = {
        name: roomKeys[i / 2].substring(5),
        area: JSON.parse(roomData.area),
        amountOfCoins: parseInt(roomData.amountOfCoins),
        coins: []
      };

      for (const coinId of coinIds) {
        const coinData = await this.redis.hgetall(`coin:${coinId}`);

        const coin: Coin = {
          id: parseInt(coinId),
          position: JSON.parse(coinData.position),
          isAvailable: coinData.isAvailable === 'true'
        };

        room.coins.push(coin);
      }

      config.rooms.push(room);
    }

    return config;
  }
}

// Usage example
const serverStore = new ServerStore();

const configuration: ServerConfiguration = {
  rooms: [
    {
      name: 'room1',
      area: {
        x: { min: 0, max: 10 },
        y: { min: 0, max: 10 },
        z: { min: 0, max: 10 }
      },
      amountOfCoins: 2,
      coins: [
        {
          id: 1,
          position: { x: 1, y: 1, z: 1 },
          isAvailable: true
        },
        {
          id: 2,
          position: { x: 2, y: 2, z: 2 },
          isAvailable: false
        }
      ]
    },
    {
      name: 'room2',
      area: {
        x: { min: 0, max: 5 },
        y: { min: 0, max: 5 },
        z: { min:*/
