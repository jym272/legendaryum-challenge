import express from 'express';
import * as expressMiddleware from '@middlewares/express';

const middlewares = [expressMiddleware];

export const initMiddlewares = (server: express.Express) => {
  for (const middleware of middlewares) {
    middleware.attach(server);
  }
};
