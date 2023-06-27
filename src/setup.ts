import express from 'express';
import 'express-async-errors';
import { addRoutes } from '@routes/index';
import { initMiddlewares } from '@middlewares/index';
import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(6767, 'localhost');
    // redisClient.status; // TODO: remove this line
    // redisClient.on('error', (err: Error) => {
    //   if (err.message.includes('ECONNREFUSED')) {
    //     throw new Error(`Failed to connect to Redis: ${err.message}`);
    //   }
    // });
  }
  return redisClient;
};

// export const closeRedisClient = () => {
//   if (redisClient) {
//     redisClient.disconnect();
//     redisClient = null;
//   }
// };

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
// const configureServer = (server: express.Express) => {
//   server.set('trust proxy', true);
// };

export const startSetup = (server: express.Express) => {
  // configureServer(server);
  initMiddlewares(server);
  addRoutes(server);
  // server.use(commonController.errorHandler);
  return server;
};
