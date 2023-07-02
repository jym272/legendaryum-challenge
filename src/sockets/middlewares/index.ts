import { ServerIo } from '@custom-types/serverTypes';
import { auth } from '@sockets/middlewares/auth';

const middlewares = [auth];

export const addMiddlewares = (io: ServerIo) => {
  for (const middleware of middlewares) {
    io.use(middleware);
  }
};
