import { Request, Response } from 'express';
import { configuration } from '../../create';
// coins.get('/api/room/:room/coins/:id', getCoin);
export const getCoinController = () => {
  return (req: Request, res: Response) => {
    const { room } = req.params;
    const roomFound = configuration.rooms.find(r => r.name === room);
    if (!roomFound) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    const { id } = req.params;
    if (Number.isNaN(Number(id))) {
      res.status(400).json({ error: 'Invalid coin id' });
      return;
    }
    const coinID = Number(id);
    if (!roomFound.coins) {
      res.status(404).json({ error: 'Room has no coins' });
      return;
    }
    const coinFound = roomFound.coins.find(c => c.id === coinID);
    if (!coinFound) {
      res.status(404).json({ error: 'Coin not found' });
      return;
    }
    res.status(200).json({ coin: coinFound });
  };
};
