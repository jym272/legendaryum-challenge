import { Request, Response } from 'express';
import { getServerStore } from '@redis/serverStore';
import { HttpStatusCode } from 'axios';
import errorsMessages from '@custom-types/errors';
const { ROOM_NOT_FOUND } = errorsMessages;

// /api/room/:room
export const getRoomController = () => {
  return async (req: Request, res: Response) => {
    const { room } = req.params;
    const serverStore = getServerStore();
    const roomFound = await serverStore.getRoom(room);
    if (!roomFound) {
      res.status(HttpStatusCode.NotFound).json({ error: ROOM_NOT_FOUND });
      return;
    }
    res.status(HttpStatusCode.Ok).json({ room: roomFound });
  };
};
