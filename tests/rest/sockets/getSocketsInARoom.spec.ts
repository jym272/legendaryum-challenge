import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import { createServer, Server } from 'http';
import {
  ClientToServerEvents,
  RemoteSocketData,
  ServerConfiguration,
  ServerIo,
  ServerToClientsEvents
} from '@custom-types/index';
import { AddressInfo } from 'net';
import Redis from 'ioredis';
import { createPartialDone } from '@tests/utils';
import { io, Socket } from 'socket.io-client';
import { getRedisClient } from '@redis/client';
import { initializeSetup, startSetup, createApplication } from '@config/index';

let metaverseConfiguration: ServerConfiguration,
  httpServer: Server,
  port: number,
  redisClient: Redis,
  socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
  socket1: Socket<ServerToClientsEvents, ClientToServerEvents>,
  socket2: Socket<ServerToClientsEvents, ClientToServerEvents>,
  socketServer: ServerIo;

beforeAll(done => {
  metaverseConfiguration = {
    rooms: [
      {
        name: 'skyRoom',
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
        name: 'hellRoom',
        area: {
          x: {
            max: 10,
            min: 0
          },
          y: {
            max: 0,
            min: -10
          },
          z: {
            max: 0,
            min: -10
          }
        },
        amountOfCoins: 40
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

describe('/api/room/:room/sockets endpoint GET', () => {
  const sessionCredentials = {
    username: 'manuel',
    sessionID: '',
    userID: ''
  };
  beforeEach(done => {
    const partialDone = createPartialDone(6, done);
    const { server } = initializeSetup();
    const expressServer = startSetup(server);
    void redisClient.flushall((err, result) => {
      if (result === 'OK') {
        partialDone();
      }
    });
    httpServer = createServer({}, expressServer);
    void createApplication(httpServer, {}, metaverseConfiguration).then(({ io: serverIo }) => {
      socketServer = serverIo;
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, {
          auth: { username: sessionCredentials.username },
          transports: ['websocket']
        });
        socket.on('connect', partialDone);
        socket.on('session', ({ userID, sessionID }) => {
          sessionCredentials.sessionID = sessionID;
          sessionCredentials.userID = userID;

          // The username is irrelevant when a sessionID is provided to preserve the session
          socket1 = io(`http://localhost:${port}`, {
            auth: { username: 'manuelito', sessionID: sessionCredentials.sessionID },
            transports: ['websocket']
          });
          socket1.on('connect', partialDone);
          socket1.on('session', partialDone);
        });

        socket2 = io(`http://localhost:${port}`, {
          auth: { username: 'gabi' },
          transports: ['websocket']
        });
        socket2.on('connect', partialDone);
        socket2.on('session', partialDone);
      });
    });
  });

  afterEach(done => {
    socket.disconnect();
    socket1.disconnect();
    socket2.disconnect();
    socketServer.close(err => {
      if (err === undefined) {
        done();
      }
    });
  });

  ///api/room/:room/sockets
  it('every socket are joined in rooms with his socketId and userID', async () => {
    const response: AxiosResponse<RemoteSocketData[]> = await axios.get(
      `http://localhost:${port}/api/room/${socket2.id}/sockets`
    );
    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.data.length).toBe(1);

    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: socket2.id,
          data: expect.objectContaining({
            sessionID: expect.any(String) as string,
            userID: expect.any(String) as string,
            username: 'gabi'
          }) as RemoteSocketData['data'],
          rooms: expect.arrayContaining([expect.any(String), expect.any(String)]) as RemoteSocketData['rooms']
        })
      ])
    );
    expect(response.data[0].rooms.sort()).toEqual([response.data[0].data.userID, socket2.id].sort());
  });

  it('every socket on the same session are joined in a room with his userID', async () => {
    const response: AxiosResponse<RemoteSocketData[]> = await axios.get(
      `http://localhost:${port}/api/room/${sessionCredentials.userID}/sockets`
    );
    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.data.length).toBe(2);

    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String) as string,
          data: expect.objectContaining({
            sessionID: sessionCredentials.sessionID,
            userID: sessionCredentials.userID,
            username: 'manuel'
          }) as RemoteSocketData['data'],
          rooms: expect.arrayContaining([expect.any(String), expect.any(String)]) as RemoteSocketData['rooms']
        })
      ])
    );
    expect(response.data[0].rooms.sort()).toEqual([response.data[0].id, sessionCredentials.userID].sort());
    expect(response.data[1].rooms.sort()).toEqual([response.data[1].id, sessionCredentials.userID].sort());
  });

  it('if the room does not exists return an empty array', async () => {
    const response: AxiosResponse<RemoteSocketData[]> = await axios.get(
      `http://localhost:${port}/api/room/anotherOneBiteToDust/sockets`
    );
    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.data.length).toBe(0);
  });
});
