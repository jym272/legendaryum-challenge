import { Request, Response } from 'express';
import { getServerStore } from '@redis/serverStore';

export const getCoinsController = () => {
  return async (req: Request, res: Response) => {
    const { room } = req.params;
    const serverStore = getServerStore();
    const coins = await serverStore.getCoinsByRoomName(room);

    res.status(200).json({ coins });
  };
};
