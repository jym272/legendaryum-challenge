import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { createPartialDone } from '@utils/testUtils';
import { ServerConfiguration } from '@custom-types/serverTypes';
import { getNameOfTheRooms } from '@utils/serverUtils';

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

describe('handshake validation', () => {
  let httpServer: Server, socket: Socket, metaverseConfiguration: ServerConfiguration;
  beforeAll(() => {
    metaverseConfiguration = {
      rooms: [
        {
          name: 'orangeRoom',
          area: {
            x: {
              max: 10,
              min: 0
            },
            y: {
              max: 10,
              min: 0
            },
            z: {
              max: 10,
              min: 0
            }
          },
          amountOfCoins: 10
        },
        {
          name: 'blueRoom',
          area: {
            x: {
              max: 0,
              min: -10
            },
            y: {
              max: 10,
              min: 0
            },
            z: {
              max: 10,
              min: 0
            }
          },
          amountOfCoins: 10
        }
      ]
    };
  });

  beforeEach(done => {
    httpServer = createServer();
    createApplication(httpServer, {}, metaverseConfiguration);
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

  describe('username is needed in the handshake, once connected, the server emits the rooms in the metaverse', () => {
    it('must have a username in auth object', done => {
      socket.connect();
      socket.on('connect_error', err => {
        expect(err.message).toBe('no username provided');
        done();
      });
    });
    it('successful connection, username provided', done => {
      socket.auth = { username: 'user' };
      socket.connect();
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        done();
      });
    });
    it('successful connection, the server emits the ev: rooms', done => {
      const partialDone = createPartialDone(2, done);
      socket.auth = { username: 'user' };
      socket.connect();
      socket.on('connect', partialDone);
      socket.on('rooms', (rooms: string[]) => {
        expect(rooms).toEqual(getNameOfTheRooms(metaverseConfiguration));
        partialDone();
      });
    });
  });
});
