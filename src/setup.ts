import express from 'express';
import 'express-async-errors';
import { addRoutes } from '@routes/index';
import { initMiddlewares } from '@middlewares/index';

const createServer = (): express.Express => {
  return express();
};

const createExpress = () => createServer();

export const initializeSetup = () => {
  const server = createExpress();
  return {
    server
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
