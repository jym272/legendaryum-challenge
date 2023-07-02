import { Request, Response } from 'express';
import { RemoteSocketData } from '@custom-types/serverTypes';
import { getSocketServer } from '@config/createApp';

// /api/sockets
export const getSocketsController = () => {
  return async (req: Request, res: Response) => {
    const io = getSocketServer();
    const sockets = await io.fetchSockets();
    const remoteSockets: RemoteSocketData[] = sockets.map(socket => {
      return {
        id: socket.id,
        data: socket.data,
        rooms: [...socket.rooms]
      };
    });

    res.json(remoteSockets);
  };
};
