interface Error {
  error: string;
  // errorDetails?: ValidationErrorItem[];
}

interface Success<T> {
  data: T;
}

export type Response<T> = Error | Success<T>;

export interface ServerToClientsEvents {
  rooms: (rooms: string[]) => void;
  'room:joined': (room: string) => void;
}

export interface ClientToServerEvents {
  'room:join': (room: string, callback: (res?: Response<void>) => void) => void;
}

export interface SocketData {
  sessionID: string;
  userID: string;
  username: string;
}
export interface ServerConfiguration {
  rooms: string[];
  cantidadMonedas: number;
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
}
