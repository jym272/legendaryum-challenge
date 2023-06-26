import { Request, Response } from 'express';
import { configuration } from '../../create';

export const getCoinsController = () => {
  return (req: Request, res: Response) => {
    const { room } = req.params;
    const roomFound = configuration.rooms.find(r => r.name === room);
    if (!roomFound) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.status(200).json({ coins: roomFound.coins });
  };
};
