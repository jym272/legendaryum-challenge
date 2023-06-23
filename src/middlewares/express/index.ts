import express from 'express';

export const attach = (server: express.Express) => {
  server.use(express.json());
};
