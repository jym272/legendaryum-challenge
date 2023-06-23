import { Request, Response } from 'express';

export const createATicketController = () => {
  return (req: Request, res: Response) => {
    return res.status(200).json({ message: 'Ticket created.' });
  };
};
