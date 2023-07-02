import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { createPartialDone } from '@utils/testUtils';
import { ClientToServerEvents, ServerConfiguration, ServerToClientsEvents } from '@custom-types/serverTypes';
import Redis from 'ioredis';
import { getRedisClient } from '../src/setup';
import errors from '@custom-types/errors';
import { Room } from '@custom-types/appTypes';
const { NO_USERNAME_PROVIDED } = errors;

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

let redisClient: Redis, metaverseConfiguration: ServerConfiguration;

beforeAll(done => {
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
  redisClient = getRedisClient();
  redisClient.on('ready', () => {
    done();
  });
});

afterAll(done => {
  void redisClient.quit((err, res) => {
    if (res === 'OK') {
      done();
    }
  });
});

describe('connection to the server', () => {
  let httpServer: Server, socket: Socket<ServerToClientsEvents, ClientToServerEvents>;

  beforeEach(done => {
    const partialDone = createPartialDone(2, done);
    httpServer = createServer();
    void redisClient.flushall(partialDone);

    void createApplication(httpServer, {}, metaverseConfiguration).then(() => {
      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['polling'] });
        partialDone();
      });
    });
  });

  afterEach(() => {
    socket.disconnect();
    httpServer.close();
  });

  describe('connection to the server', () => {
    it('wil fail because must have a username in auth object', done => {
      socket.connect();
      socket.on('connect_error', err => {
        expect(err.message).toBe(NO_USERNAME_PROVIDED);
        done();
      });
    });
    it('successful connection, username provided, session event emitted', done => {
      const partialDone = createPartialDone(2, done);
      socket.auth = { username: 'user' };
      socket.connect();
      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        expect(socket.auth).toStrictEqual({ username: 'user' });
        expect(socket.id).toBeDefined();
        partialDone();
      });
      socket.on('session', session => {
        expect(session).toEqual(
          expect.objectContaining({
            sessionID: expect.any(String) as string,
            userID: expect.any(String) as string
          })
        );
        partialDone();
      });
    });
    it('the server emits the event rooms after emits session event', done => {
      const partialDone = createPartialDone(3, done);
      socket.auth = { username: 'user' };
      socket.connect();
      socket.on('connect', partialDone);
      socket.on('session', partialDone);
      socket.on('rooms', rooms => {
        expect(rooms).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String) as string,
              area: expect.objectContaining({
                x: expect.objectContaining({
                  max: expect.any(Number) as number,
                  min: expect.any(Number) as number
                }) as Room['area']['x'],
                y: expect.objectContaining({
                  max: expect.any(Number) as number,
                  min: expect.any(Number) as number
                }) as Room['area']['y'],
                z: expect.objectContaining({
                  max: expect.any(Number) as number,
                  min: expect.any(Number) as number
                }) as { max: number; min: number }
              }) as Room['area'],
              amountOfCoins: expect.any(Number) as number
            })
          ])
        );
        partialDone();
      });
    });
  });
});
