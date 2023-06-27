import { Request, Response } from 'express';
import { getServerStore } from '@redis/serverStore';

export const getCoinController = () => {
  return async (req: Request, res: Response) => {
    const { room, id } = req.params;
    if (Number.isNaN(Number(id))) {
      res.status(400).json({ error: 'Invalid coin id' });
      return;
    }
    const serverStore = getServerStore();
    const coin = await serverStore.getCoin(room, Number(id));
    if (!coin) {
      res.status(404).json({ error: 'Coin not found' });
      return;
    }
    res.status(200).json({ coin });
  };
};
