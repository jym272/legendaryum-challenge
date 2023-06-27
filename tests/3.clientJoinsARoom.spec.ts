import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import {
  ClientToServerEvents,
  Coin,
  Error,
  ServerConfiguration,
  ServerToClientsEvents,
  Success
} from '@custom-types/serverTypes';
import errorsMessages from '@custom-types/errors';
import Redis from 'ioredis';
import { createPartialDone } from '@utils/testUtils';
import { getRedisClient } from '../src/setup';
const { INVALID_ROOM } = errorsMessages;
describe('client joins a room in the metaverse', () => {
  let httpServer: Server,
    socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    metaverseConfiguration: ServerConfiguration,
    redisClient: Redis;
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
              min: -2
            },
            y: {
              max: 2,
              min: 0
            },
            z: {
              max: 1,
              min: 0
            }
          },
          amountOfCoins: 5
        }
      ]
    };
    redisClient = getRedisClient();
    // if (redisClient.status === 'close') {
    //   void redisClient.connect();
    // }
    redisClient.on('ready', () => {
      done();
    });
  });

  beforeEach(done => {
    const partialDone = createPartialDone(2, done);

    httpServer = createServer();
    void redisClient.flushall(partialDone);
    void createApplication(httpServer, {}, metaverseConfiguration).then(() => {
      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['websocket'] });
        socket.auth = { username: 'user' };
        socket.connect();
        socket.on('connect', partialDone);
      });
    });
  });

  afterEach(() => {
    httpServer.close();
    socket.disconnect();
  });

  afterAll(done => {
    void redisClient.quit(done);
  });

  describe('client emits room:join event after successful connection ', () => {
    it('invalid room provided, callback is executed and return an error', done => {
      socket.emit('room:join', 'invalid_room', res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(true);
        const { error } = res as Error;
        expect(error).toBe(INVALID_ROOM);
        done();
      });
    });

    it('if emit event is successful, callback is executed sending all coins', done => {
      socket.emit('room:join', 'blueRoom', res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(false);
        const { data: coins } = res as Success<Coin[]>;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because is defined in object
        const { amountOfCoins } = metaverseConfiguration.rooms.find(room => room.name === 'blueRoom')!;
        expect(coins.length).toBe(amountOfCoins);
        expect(coins).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number) as number,
              position: expect.objectContaining({
                x: expect.any(Number) as number,
                y: expect.any(Number) as number,
                z: expect.any(Number) as number
              }) as { x: number; y: number; z: number }
            })
          ])
        );
        done();
      });
    });
  });
});
