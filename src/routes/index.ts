import express from 'express';
import { coins } from '@routes/coins';
import { rooms } from '@routes/rooms';
import { sockets } from '@routes/sockets';

const routes = [coins, rooms, sockets];

export const addRoutes = (server: express.Express) => {
  for (const route of routes) {
    server.use(route);
  }
};
