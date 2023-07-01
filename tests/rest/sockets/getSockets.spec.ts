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
import { createPartialDone } from '@utils/testUtils';
import { getRedisClient, initializeSetup, startSetup } from '../../../src/setup';
import { createApplication } from '../../../src/create';
import { io, Socket } from 'socket.io-client';

let metaverseConfiguration: ServerConfiguration,
  httpServer: Server,
  port: number,
  redisClient: Redis,
  socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
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

describe('/api/sockets endpoint GET', () => {
  beforeEach(done => {
    const partialDone = createPartialDone(3, done);
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
          auth: { username: 'manuel' },
          transports: ['websocket']
        });
        socket.on('connect', partialDone);
        // the socket must join(socket.data.userID); if waiting for session event is too fast
        // add a timeout to wait for the socket to join the room
        socket.on('session', partialDone);
      });
    });
  });

  afterEach(done => {
    socket.disconnect();
    socketServer.close(err => {
      if (err === undefined) {
        done();
      }
    });
  });

  it('should return one socket', async () => {
    const response: AxiosResponse<RemoteSocketData[]> = await axios.get(`http://localhost:${port}/api/sockets`);
    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.data.length).toBe(1);
    const remoteSocket = response.data[0];
    expect(remoteSocket).toEqual(
      expect.objectContaining({
        id: expect.any(String) as string,
        data: expect.objectContaining({
          sessionID: expect.any(String) as string,
          userID: expect.any(String) as string,
          username: 'manuel'
        }) as RemoteSocketData['data'],
        rooms: expect.arrayContaining([expect.any(String) as string]) as RemoteSocketData['rooms']
      }) as RemoteSocketData
    );
    expect(remoteSocket.rooms.sort()).toEqual([remoteSocket.id, remoteSocket.data.userID].sort());
  });

  it('the socket is disconnected, should return an empty array', async () => {
    socket.disconnect();
    await new Promise(resolve => setTimeout(resolve, 20));
    const response: AxiosResponse<RemoteSocketData[]> = await axios.get(`http://localhost:${port}/api/sockets`);
    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.data.length).toBe(0);
  });
});
