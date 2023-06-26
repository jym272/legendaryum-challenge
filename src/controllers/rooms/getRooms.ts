import { Request, Response } from 'express';
import { log } from '@utils/logs';
import { configuration } from '../../create';

export const getRoomsController = () => {
  return (req: Request, res: Response) => {
    log(`Worker ${process.pid} working`);
    res.status(200).json({ rooms: configuration.rooms });
  };
};
