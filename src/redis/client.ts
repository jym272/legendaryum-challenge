import Redis from 'ioredis';
import { getEnvOrFail } from '@utils/env';

let redisClient: Redis | null = null;
const redisPort = getEnvOrFail('REDIS_PORT');
const redisHost = getEnvOrFail('REDIS_HOST');
export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(Number(redisPort), redisHost);
    redisClient.on('error', (err: Error) => {
      if (err.message.includes('ECONNREFUSED')) {
        throw new Error(`Failed to connect to Redis: ${err.message}`);
      }
    });
  }
  return redisClient;
};
