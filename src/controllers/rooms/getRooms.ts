import { Request, Response } from 'express';
import { getServerStore } from '@redis/index';
import { HttpStatusCode } from 'axios';

// /api/rooms
export const getRoomsController = () => {
  return async (req: Request, res: Response) => {
    const serverStore = getServerStore();
    const rooms = await serverStore.getAllRooms();
    res.status(HttpStatusCode.Ok).json({ rooms });
  };
};
