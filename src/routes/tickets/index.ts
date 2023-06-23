import { Router } from 'express';
import { ticketsController } from '@controllers/tickets';
const { createATicket } = ticketsController;

export const tickets = Router();

tickets.get('/api/tickets', createATicket);
