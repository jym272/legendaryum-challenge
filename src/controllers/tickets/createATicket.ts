import { Request, Response } from 'express';
import { log } from '@utils/logs';

export const createATicketController = () => {
  return (req: Request, res: Response) => {
    log(`Worker ${process.pid} working`);
    res.status(200).json({ message: 'Ticket created.' });
  };
};
