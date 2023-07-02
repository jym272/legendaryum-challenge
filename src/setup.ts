import express from 'express';
import 'express-async-errors';
import { addRoutes } from '@routes/index';
import { initMiddlewares } from '@middlewares/index';
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

const createServer = (): express.Express => {
  return express();
};

const createExpress = () => createServer();

export const initializeSetup = () => {
  const server = createExpress();
  return {
    server,
    redisServer: getRedisClient()
  };
};

// otherwise the cookie will not be sent over https connection
const configureServer = (server: express.Express) => {
  server.set('trust proxy', true);
};

export const startSetup = (server: express.Express) => {
  configureServer(server);
  initMiddlewares(server);
  addRoutes(server);
  // server.use(commonController.errorHandler); // TODO: add endpoint health etc
  return server;
};
