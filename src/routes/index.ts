import express from 'express';
import { coins } from '@routes/coins';
import { rooms } from '@routes/rooms';

const routes = [coins, rooms];

export const addRoutes = (server: express.Express) => {
  for (const route of routes) {
    server.use(route);
  }
};
