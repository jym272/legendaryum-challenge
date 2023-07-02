import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '@config/index';
import {
  ClientToServerEvents,
  Coin,
  Error,
  ServerConfiguration,
  ServerIo,
  ServerToClientsEvents,
  Success
} from '@custom-types/index';
import errorsMessages from '@custom-types/errors';
import Redis from 'ioredis';
import { createPartialDone } from '@tests/utils';
import { getRedisClient } from '@redis/client';
import { getRemoteSockets } from '@tests/utils';
const { INVALID_ROOM } = errorsMessages;

let metaverseConfiguration: ServerConfiguration, redisClient: Redis;
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
describe('client joins a room in the metaverse', () => {
  let httpServer: Server, socket: Socket<ServerToClientsEvents, ClientToServerEvents>, socketServer: ServerIo;

  beforeEach(done => {
    httpServer = createServer();
    void redisClient.flushall((err, result) => {
      if (result === 'OK') {
        void createApplication(httpServer, {}, metaverseConfiguration).then(({ io: serverIo }) => {
          socketServer = serverIo;
          httpServer.listen(() => {
            const port = (httpServer.address() as AddressInfo).port;
            socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['websocket'] });
            socket.auth = { username: 'user' };
            socket.connect();
            socket.on('connect', done);
          });
        });
      }
    });
  });

  afterEach(done => {
    socket.disconnect();
    //also close the http server that socket.io creates
    socketServer.close(err => {
      if (err === undefined) {
        done();
      }
    });
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

    it('client join successfully to two rooms', done => {
      const partialDone = createPartialDone(2, done);
      socket.emit('room:join', 'orangeRoom', res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(false);
        partialDone();
      });
      socket.emit('room:join', 'blueRoom', res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(false);
        partialDone();
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

describe('two sockets in the same session, if one socket join a room the other socket also is joined', () => {
  let httpServer: Server,
    socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    socket2: Socket<ServerToClientsEvents, ClientToServerEvents>,
    port: number,
    socketServer: ServerIo;

  const sessionCredentials = {
    username: 'tilo',
    sessionID: '',
    userID: ''
  };

  beforeAll(done => {
    const partialDone = createPartialDone(2, done);
    httpServer = createServer();
    void redisClient.flushall((err, result) => {
      if (result === 'OK') {
        void createApplication(httpServer, {}, metaverseConfiguration).then(({ io: serverIo }) => {
          socketServer = serverIo;
          httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            socket = io(`http://localhost:${port}`, {
              auth: { username: sessionCredentials.username },
              transports: ['websocket']
            });
            socket.on('connect', () => {
              partialDone();
            });
            socket.on('session', ({ sessionID, userID }) => {
              sessionCredentials.sessionID = sessionID;
              sessionCredentials.userID = userID;
              socket2 = io(`http://localhost:${port}`, {
                auth: { username: 'user', sessionID: sessionCredentials.sessionID },
                transports: ['websocket']
              });
              socket2.on('connect', () => {
                partialDone();
              });
            });
          });
        });
      }
    });
  });

  afterAll(done => {
    socket.disconnect();
    socketServer.close(err => {
      if (err === undefined) {
        done();
      }
    });
  });

  describe('first socket joins two rooms', () => {
    beforeEach(done => {
      const partialDone = createPartialDone(2, done);
      socket.emit('room:join', 'orangeRoom', partialDone).emit('room:join', 'blueRoom', partialDone);
    });

    it('second socket from the same session also joined the same rooms', async () => {
      const remoteSockets = await getRemoteSockets(socketServer);
      const socketRooms = remoteSockets.find(remoteSocket => remoteSocket.id === socket.id)?.rooms;
      const socket2Rooms = remoteSockets.find(remoteSocket => remoteSocket.id === socket2.id)?.rooms;
      expect(socketRooms?.sort()).toEqual(['orangeRoom', 'blueRoom', sessionCredentials.userID, socket.id].sort());
      expect(socket2Rooms?.sort()).toEqual(['orangeRoom', 'blueRoom', sessionCredentials.userID, socket2.id].sort());
    });
  });
});
