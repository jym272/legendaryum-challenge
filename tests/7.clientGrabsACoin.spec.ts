import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '@config/index';
import {
  ClientToServerEvents,
  Coin,
  ServerConfiguration,
  ServerIo,
  ServerToClientsEvents,
  Success
} from '@custom-types/index';
import errorsMessages from '@custom-types/errors';
import { createPartialDone } from '@tests/utils';
import Redis from 'ioredis';
import { getRedisClient } from '@redis/client';
const { COIN_NOT_FOUND, SOCKET_NOT_IN_ROOM, COIN_NOT_AVAILABLE } = errorsMessages;

let metaverseConfiguration: ServerConfiguration;
let redisClient: Redis;

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
        amountOfCoins: 20
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

describe('one user grabs a coin', () => {
  let httpServer: Server, socket: Socket<ServerToClientsEvents, ClientToServerEvents>, orangeCoins: Coin[];
  beforeEach(done => {
    const partialDone = createPartialDone(3, done);
    httpServer = createServer();
    void redisClient.flushall(partialDone);
    void createApplication(httpServer, {}, metaverseConfiguration).then(() => {
      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['websocket'] });
        socket.auth = { username: 'user' }; //TODO: validate username in server, it can be differente users!
        socket.connect();
        socket.on('connect', partialDone);
        socket.emit('room:join', 'orangeRoom', res => {
          const { data } = res as Success<Coin[]>;
          orangeCoins = data;
          partialDone();
        });
      });
    });
  });

  afterEach(() => {
    httpServer.close();
    socket.disconnect();
  });

  describe('client joins orangeRoom, receive coins and grab a coin', () => {
    it('will receive an error trying to grab a coin in a room that the socket is not in', done => {
      socket.emit('coin:grab', { coinID: orangeCoins[0].id, room: 'anotherRoom' }, res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(true);
        const { error } = res as { error: string };
        expect(error).toBe(SOCKET_NOT_IN_ROOM);
        done();
      });
    });
    it('will receive an error trying to grab a coin with an invalid id', done => {
      const invalidId = 99999999;
      socket.emit('coin:grab', { coinID: invalidId, room: 'orangeRoom' }, res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(true);
        const { error } = res as { error: string };
        expect(error).toBe(COIN_NOT_FOUND);
        done();
      });
    });
    it('user grabs a coin in the orangeRoom', done => {
      socket.emit('coin:grab', { coinID: orangeCoins[0].id, room: 'orangeRoom' }, res => {
        expect(res).toBeUndefined();
        done();
      });
    });
  });
});

describe('two users in the orangeRoom', () => {
  let httpServer: Server,
    socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    anotherSocket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    userOrangeCoins: Coin[],
    anotherUserOrangeCoins: Coin[],
    socketServer: ServerIo;

  beforeEach(done => {
    const partialDone = createPartialDone(5, done);
    void redisClient.flushall(partialDone);
    httpServer = createServer();
    void createApplication(httpServer, {}, metaverseConfiguration).then(({ io: serverIo }) => {
      socketServer = serverIo;
      httpServer.listen(() => {
        const port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, {
          auth: {
            username: 'user'
          },
          transports: ['websocket']
        });
        anotherSocket = io(`http://localhost:${port}`, {
          auth: {
            username: 'anotherUser' // TODO: validate same usernames!!
          },
          transports: ['websocket']
        });
        socket.on('connect', partialDone);
        socket.emit('room:join', 'orangeRoom', res => {
          const { data } = res as Success<Coin[]>;
          userOrangeCoins = data;
          partialDone();
        });
        anotherSocket.on('connect', partialDone);
        anotherSocket.emit('room:join', 'orangeRoom', res => {
          const { data } = res as Success<Coin[]>;
          anotherUserOrangeCoins = data;
          partialDone();
        });
      });
    });
  });

  afterEach(done => {
    socket.disconnect();
    anotherSocket.disconnect();
    socketServer.close(err => {
      if (err === undefined) {
        done();
      }
    });
  });

  describe('user grabs a coin, another user get coin:grabbed event', () => {
    it('anotherSocket will receive coin:grabbed event because user grab a coin', done => {
      const partialDone = createPartialDone(2, done);
      socket.emit('coin:grab', { coinID: userOrangeCoins[0].id, room: 'orangeRoom' }, res => {
        expect(res).toBeUndefined();
        partialDone();
      });
      anotherSocket.on('coin:grabbed', ({ coinID, room }) => {
        expect(room).toBe('orangeRoom');
        expect(coinID).toBe(userOrangeCoins[0].id);
        expect(userOrangeCoins[0].id).toBe(anotherUserOrangeCoins[0].id);
        partialDone();
      });
    });
  });
  describe('anotherSocket try to grab a coin that is not available', () => {
    beforeEach(done => {
      socket.emit('coin:grab', { coinID: userOrangeCoins[10].id, room: 'orangeRoom' }, res => {
        expect(res).toBeUndefined();
        done();
      });
    });
    it('will fail to grab the coin, the coin is not available', done => {
      anotherSocket.emit('coin:grab', { coinID: userOrangeCoins[10].id, room: 'orangeRoom' }, res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(true);
        const { error } = res as { error: string };
        expect(error).toBe(COIN_NOT_AVAILABLE);
        done();
      });
    });
  });
});
