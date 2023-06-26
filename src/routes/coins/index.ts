import { Router } from 'express';
import { coinsController } from '@controllers/index';
const { getCoins, getCoin } = coinsController;

export const coins = Router();

coins.get('/api/room/:room/coins', getCoins);
// coins.get('/api/room/:room/coins?limit=10', getCoins); //TODO: cuando esté todo en redis!!
coins.get('/api/room/:room/coins/:id', getCoin);
