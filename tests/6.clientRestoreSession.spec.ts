import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { createPartialDone } from '@utils/testUtils';
import {
  ClientToServerEvents,
  ServerConfiguration,
  ServerIo,
  ServerToClientsEvents,
  Success
} from '@custom-types/serverTypes';
import Redis from 'ioredis';
import { getRedisClient } from '../src/setup';
import { Coin } from '@custom-types/appTypes';

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
describe('client join a room, get the coins', () => {
  let httpServer: Server,
    socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    socket2: Socket<ServerToClientsEvents, ClientToServerEvents>,
    port: number,
    orangeRoomCoins: Coin[],
    blueRoomCoins: Coin[],
    socketServer: ServerIo;

  const sessionCredentials = {
    username: 'juana',
    sessionID: '',
    userID: ''
  };

  beforeEach(done => {
    const partialDone = createPartialDone(3, done);
    httpServer = createServer();
    void redisClient.flushall(partialDone);

    void createApplication(httpServer, {}, metaverseConfiguration).then(({ io: serverIo }) => {
      socketServer = serverIo;
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, {
          auth: { username: sessionCredentials.username },
          transports: ['websocket']
        });
        socket.on('session', ({ sessionID, userID }) => {
          sessionCredentials.sessionID = sessionID;
          sessionCredentials.userID = userID;
          partialDone();
        });
        socket.on('connect', () => {
          socket.emit('room:join', 'orangeRoom', res => {
            const { data: coins } = res as Success<Coin[]>;
            orangeRoomCoins = coins;
            partialDone();
          });
        });
      });
    });
  });

  afterEach(done => {
    socket.disconnect();
    socket2.disconnect();
    socketServer.close(err => {
      if (err === undefined) {
        done();
      }
    });
  });

  const getRemoteSockets = async () => {
    return (await socketServer.fetchSockets()).map(socket => {
      return {
        id: socket.id,
        data: socket.data,
        rooms: [...socket.rooms]
      };
    });
  };

  it('second socket is connected from the same client and the sessions room is restored for that socket', done => {
    const partialDone = createPartialDone(3, done);

    socket2 = io(`http://localhost:${port}`, {
      auth: { username: sessionCredentials.username, sessionID: sessionCredentials.sessionID },
      transports: ['websocket']
    });
    socket2.on('connect', partialDone);
    socket2.on('session', partialDone);
    socket2.on('session:rejoinRooms', rooms => {
      expect(rooms.length).toBe(1);
      const orangeRoom = rooms[0];
      expect(orangeRoom.name).toBe('orangeRoom');
      expect(orangeRoom.coins.length).toBe(orangeRoomCoins.length);
      expect(orangeRoom.coins.sort((a, b) => a.id - b.id)).toEqual(orangeRoomCoins.sort((a, b) => a.id - b.id));
      partialDone();
    });
  });

  it('socket join the blueRoom, then, second socket is connected and restored the sessions', done => {
    const partialDone = createPartialDone(3, done);

    socket.emit('room:join', 'blueRoom', res => {
      const { data: coins } = res as Success<Coin[]>;
      blueRoomCoins = coins;

      socket2 = io(`http://localhost:${port}`, {
        auth: { username: sessionCredentials.username, sessionID: sessionCredentials.sessionID },
        transports: ['websocket']
      });
      socket2.on('connect', partialDone);
      socket2.on('session', partialDone);
      socket2.on('session:rejoinRooms', rooms => {
        expect(rooms.length).toBe(2);
        const orangeRoom = rooms.find(room => room.name === 'orangeRoom');
        expect(orangeRoom?.coins.length).toBe(orangeRoomCoins.length);
        expect(orangeRoom?.coins.sort((a, b) => a.id - b.id)).toEqual(orangeRoomCoins.sort((a, b) => a.id - b.id));

        const blueRoom = rooms.find(room => room.name === 'blueRoom');
        expect(blueRoom?.coins.length).toBe(blueRoomCoins.length);
        expect(blueRoom?.coins.sort((a, b) => a.id - b.id)).toEqual(blueRoomCoins.sort((a, b) => a.id - b.id));

        void getRemoteSockets().then(remoteSockets => {
          const socket_2 = remoteSockets.find(socket => socket.id === socket2.id);
          expect(socket_2?.rooms.sort()).toEqual(
            ['blueRoom', socket2.id, 'orangeRoom', sessionCredentials.userID].sort()
          );
          partialDone();
        });
      });
    });
  });
});
