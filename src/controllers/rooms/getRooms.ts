import { Request, Response } from 'express';
import { getServerStore } from '@redis/index';

export const getRoomsController = () => {
  return async (req: Request, res: Response) => {
    const serverStore = getServerStore();
    const rooms = await serverStore.getAllRooms();
    res.status(200).json({ rooms });
  };
};
