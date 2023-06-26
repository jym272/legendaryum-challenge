import { Router } from 'express';
import { socketsController } from '@controllers/index';
const { getSockets, getSocketsInARoom } = socketsController;

export const sockets = Router();

sockets.get('/api/room/:room/sockets', getSocketsInARoom);
sockets.get('/api/sockets', getSockets);
