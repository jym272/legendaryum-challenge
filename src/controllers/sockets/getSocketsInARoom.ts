import { Request, Response } from 'express';
import { RemoteSocketData } from '@custom-types/serverTypes';
import { getSocketServer } from '@config/createApp';

// /api/room/:room/sockets
export const getSocketsInARoomController = () => {
  return async (req: Request, res: Response) => {
    const io = getSocketServer();
    const sockets = await io.in(req.params.room).fetchSockets();
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
