import express from 'express';
import { tickets } from '@routes/tickets';

const routes = [tickets];

export const addRoutes = (server: express.Express) => {
  for (const route of routes) {
    server.use(route);
  }
};
