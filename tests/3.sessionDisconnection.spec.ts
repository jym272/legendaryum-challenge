import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { createPartialDone } from '@utils/testUtils';
import { ClientToServerEvents, ServerConfiguration, ServerToClientsEvents } from '@custom-types/serverTypes';
import Redis from 'ioredis';
import { getRedisClient } from '../src/setup';
import { Session } from '@redis/sessionStore';

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

describe('disconnection to the server', () => {
  let httpServer: Server, socket: Socket<ServerToClientsEvents, ClientToServerEvents>;

  beforeEach(done => {
    const partialDone = createPartialDone(2, done);
    httpServer = createServer();
    void redisClient.flushall(partialDone);

    void createApplication(httpServer, {}, metaverseConfiguration).then(() => {
      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        // transport polling for testing disconnection
        socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['polling'] });
        socket.auth = { username: 'user' };
        socket.connect();
        socket.on('connect', partialDone);
      });
    });
  });

  afterEach(() => {
    socket.disconnect();
    httpServer.close();
  });

  let sessionId: string;
  it('once disconnected the session change the connected param', done => {
    const partialDone = createPartialDone(2, done);
    socket.on('session', ({ sessionID }) => {
      sessionId = sessionID;
      void redisClient.hgetall(`session:${sessionId}`, (err, session) => {
        const s = session as unknown as Session;
        expect(s.connected).toBe('true');
        expect(err).toBeNull();
        partialDone();
        socket.disconnect();
      });
    });

    socket.on('disconnect', () => {
      const maxTime = 50;
      const exeTime = Date.now();
      // it needs to wait for the server to make the change in the session
      const loop = () => {
        void redisClient.hgetall(`session:${sessionId}`, (err, session) => {
          const s = session as Record<string, string> & { connected: 'true' | 'false' };
          expect(err).toBeNull();
          if (Date.now() - exeTime > maxTime) {
            throw new Error('timeout');
          }
          if (s.connected === 'true') return loop();
          partialDone();
        });
      };
      loop();
    });
  });
});
