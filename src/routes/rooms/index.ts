import { Router } from 'express';
import { roomsController } from '@controllers/index';
const { getRooms, getRoom } = roomsController;

export const rooms = Router();

//TES ENDOPOUNT
//cantidad de monedas disponibles en una room /api/rooms/:room/coins
//cunato hay conectandos en el socket!!, caracteristicas de cada uno de ellos // TODO:!!!!
//cuantos cuartos hay disponibles
// TODO: middleware for authorization???!

rooms.get('/api/rooms', getRooms);
rooms.get('/api/room/:room', getRoom);
