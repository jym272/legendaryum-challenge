import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { getServerConfiguration } from '@utils/server';

// agregar las features al readme, por ejemplo las sessions del cliente
// los clientes al conectarse neceistan auth con username y room
// si es el mismo user ya sabemos que se encuentra conectado en cierto cuarto
// el cuarto es compartido por todos los usuarios que estan en el mismo room
// en el room hay estrellas, el primer user que toca una estrella la apaga,
// si otro usuario toca la misma estrella el server le dice que ya esta apagada.

// describir los métodos en socket io que se utilizan para realizar
// el desafío

// muchas ideas -> configurar el server con el json y luego con el json files
// darle distribuicion a la probabilidad de que aparezcan las estrellas
// los test tiene que tener un docker compose con el server de redis totalmente
// limpio, serguir testeando e implementando funcionalidades y test

// const createPartialDone = (count: number, done: () => void) => {
//   let i = 0;
//   return () => {
//     if (++i === count) {
//       done();
//     }
//   };
// };

describe('handshake validation', () => {
  let httpServer: Server, socket: Socket;

  beforeEach(done => {
    getServerConfiguration();
    httpServer = createServer();
    createApplication(httpServer, {}, { rooms: ['room1', 'room2', 'room3', 'room4', 'room5', 'room6'] });
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['websocket'] });
      done();
    });
  });

  afterEach(() => {
    httpServer.close();
    socket.disconnect();
  });

  describe('username is first in the middleware in handshake', () => {
    it('must have a username', done => {
      socket.connect();
      socket.on('connect_error', err => {
        expect(err.message).toBe('no username provided');
        done();
      });
    });
  });

  describe('validate room prop in auth object in handshake', () => {
    it('have a username, should have a room defined to join in', done => {
      socket.auth = { username: 'user' };
      socket.connect();
      socket.on('connect_error', err => {
        expect(err.message).toBe('no room provided');
        done();
      });
    });
    it('have a username, should have a valid room to join in', done => {
      socket.auth = { username: 'user', room: 'invalid_room' };
      // TODO: refactorizar cuando se tenga el objecto json
      socket.connect();
      socket.on('connect_error', err => {
        expect(err.message).toBe('invalid room provided');
        done();
      });
    });

    it('have a username, have a valid room, connection granted', done => {
      socket.auth = { room: 'room1', username: 'user' };
      socket.connect();
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        done();
      });
    });
  });
});
