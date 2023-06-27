export interface Error {
  error: string;
  // errorDetails?: ValidationErrorItem[];
}

export interface Success<T> {
  data: T;
}

export type Response<T> = Error | Success<T>;

export interface Coin {
  id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  isAvailable: boolean;
}
export type RoomName = string;

export interface ServerToClientsEvents {
  rooms: (rooms: RoomName[]) => void;
  // 'room:joined': (coins: Coin[]) => void;
  //El micro debe mandar una señal a todos los clientes, indicando qué monedas dejan de estar disponibles (cuando alguien más la agarra).
  'coin:grabbed': ({ coinID, room }: { coinID: number; room: RoomName }) => void;
}
export interface ClientToServerEvents {
  'room:join': (room: RoomName, callback: (res?: Response<Coin[]>) => void) => void;
  //El cliente puede mandar una señal al micro indicando que agarró una moneda, para que el micro la borre de las monedas disponibles.
  'coin:grab': ({ coinID, room }: { coinID: number; room: RoomName }, callback: (res?: Response<void>) => void) => void;
}

export interface SocketData {
  sessionID: string;
  userID: string;
  username: string;
}

export interface Room {
  name: RoomName;
  area: {
    x: {
      max: number;
      min: number;
    };
    y: {
      max: number;
      min: number;
    };
    z: {
      max: number;
      min: number;
    };
  };
  amountOfCoins: number;
  coins?: Coin[];
}

export interface ServerConfiguration {
  rooms: Room[];
}
