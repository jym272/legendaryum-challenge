import { Coin, Room, RoomName, RoomWithRequiredCoins } from '@custom-types/appTypes';
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export interface Error {
  error: string;
}

export interface Success<T> {
  data: T;
}

export type Response<T> = Error | Success<T>;

export interface SocketData {
  sessionID: string;
  userID: string;
  username: string;
}
export interface ServerToClientsEvents {
  session: ({ sessionID, userID }: { sessionID: string; userID: string }) => void;
  rooms: (rooms: Room[]) => void;
  'session:rejoinRooms': (rooms: RoomWithRequiredCoins[]) => void;
  'coin:grabbed': ({ coinID, room }: { coinID: number; room: RoomName }) => void;
}
export interface ClientToServerEvents {
  'room:join': (room: RoomName, callback: (res?: Response<Coin[]>) => void) => void;
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
export type SocketIo = Socket<ClientToServerEvents, ServerToClientsEvents, DefaultEventsMap, SocketData>;
