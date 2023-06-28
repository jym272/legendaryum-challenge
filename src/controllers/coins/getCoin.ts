import { Request, Response } from 'express';
import { getServerStore } from '@redis/serverStore';
import errorsMessages from '@custom-types/errors';
import { HttpStatusCode } from 'axios';
const { INVALID_COIN_ID, COIN_NOT_FOUND } = errorsMessages;

// /api/room/:room/coins/:id
export const getCoinController = () => {
  return async (req: Request, res: Response) => {
    const { room, id } = req.params;
    if (Number.isNaN(Number(id))) {
      res.status(HttpStatusCode.BadRequest).json({ error: INVALID_COIN_ID });
      return;
    }
    const serverStore = getServerStore();
    const coin = await serverStore.getCoin(room, Number(id));
    if (!coin) {
      res.status(HttpStatusCode.NotFound).json({ error: COIN_NOT_FOUND });
      return;
    }
    res.status(HttpStatusCode.Ok).json({ coin });
  };
};
