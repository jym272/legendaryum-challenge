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
