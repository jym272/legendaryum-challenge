import { Request, Response } from 'express';
import { getSocketServer } from '../../create';
import { RemoteSocketData } from '@custom-types/serverTypes';

// /api/room/:room/sockets
export const getSocketsInARoomController = () => {
  ///api/room/:room/sockets
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
