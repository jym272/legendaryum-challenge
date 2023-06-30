import { Coin, Room, RoomWithRequiredCoins } from '@custom-types/appTypes';
import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export interface Error {
  error: string;
  // errorDetails?: ValidationErrorItem[];
}

export interface Success<T> {
  data: T;
}

export type Response<T> = Error | Success<T>;

export type RoomName = string;
// socket.emit('session', {
//       sessionID: socket.data.sessionID,
//       userID: socket.data.userID
//     });

export interface SocketData {
  sessionID: string;
  userID: string;
  username: string;
}
export interface ServerToClientsEvents {
  session: ({ sessionID, userID }: { sessionID: string; userID: string }) => void;
  rooms: (rooms: Room[]) => void;
  'session:rejoinRooms': (rooms: RoomWithRequiredCoins[]) => void;
  // 'room:joined': (coins: Coin[]) => void;
  //El micro debe mandar una señal a todos los clientes, indicando qué monedas dejan de estar disponibles (cuando alguien más la agarra).
  'coin:grabbed': ({ coinID, room }: { coinID: number; room: RoomName }) => void;
}
export interface ClientToServerEvents {
  'room:join': (room: RoomName, callback: (res?: Response<Coin[]>) => void) => void;
  //El cliente puede mandar una señal al micro indicando que agarró una moneda, para que el micro la borre de las monedas disponibles.
  'coin:grab': ({ coinID, room }: { coinID: number; room: RoomName }, callback: (res?: Response<void>) => void) => void;
}

export interface ServerConfiguration {
  rooms: Room[];
}

export interface RemoteSocketData {
  id: string;
  data: SocketData;
  rooms: string[];
}

export type ServerIo = Server<ClientToServerEvents, ServerToClientsEvents, DefaultEventsMap, SocketData>;
