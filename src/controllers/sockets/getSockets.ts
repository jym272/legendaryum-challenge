import { Request, Response } from 'express';
import { getSocketServer } from '../../create';
import { SocketData } from '@custom-types/serverTypes';

interface RemoteSocketData {
  id: string;
  data: SocketData;
  rooms: string[];
}

/// /api/sockets

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
