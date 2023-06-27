import { Request, Response } from 'express';
import { getServerStore } from '@redis/serverStore';

export const getRoomController = () => {
  return async (req: Request, res: Response) => {
    const { room } = req.params;
    const serverStore = getServerStore();
    const roomFound = await serverStore.getRoom(room);
    if (!roomFound) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.status(200).json({ room: roomFound });
  };
};
