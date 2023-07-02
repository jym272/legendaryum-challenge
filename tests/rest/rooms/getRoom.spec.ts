import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import { createServer, Server } from 'http';
import { Room, ServerConfiguration } from '@custom-types/index';
import { AddressInfo } from 'net';
import Redis from 'ioredis';
import { createPartialDone } from '@tests/utils';
import { initializeSetup, startSetup } from '../../../src/setup';
import { createApplication } from '../../../src/create';
import errorsMessages from '@custom-types/errors';
import { getRedisClient } from '@redis/client';
const { ROOM_NOT_FOUND } = errorsMessages;

let metaverseConfiguration: ServerConfiguration;
let httpServer: Server, port: number;
let redisClient: Redis;

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

beforeEach(done => {
  const partialDone = createPartialDone(2, done);
  const { server } = initializeSetup();
  const expressServer = startSetup(server);
  void redisClient.flushall(partialDone);
  httpServer = createServer({}, expressServer);
  void createApplication(httpServer, {}, metaverseConfiguration).then(() => {
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      partialDone();
    });
  });
});

afterEach(() => {
  httpServer.close();
});

afterAll(done => {
  void redisClient.quit((err, res) => {
    if (res === 'OK') {
      done();
    }
  });
});

describe('/api/room/:room endpoint GET', () => {
  it('should return an 404, room not found', async () => {
    try {
      await axios.get(`http://localhost:${port}/api/room/invalidRoom`);
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      expect(error.response?.status).toBe(HttpStatusCode.NotFound);
      expect(error.response?.data).toEqual(
        expect.objectContaining({
          error: ROOM_NOT_FOUND
        })
      );
    }
  });

  it('should return the room', async () => {
    const roomNames = metaverseConfiguration.rooms.map(room => room.name);

    for await (const roomName of roomNames) {
      const response: AxiosResponse<{ room: Room }> = await axios.get(`http://localhost:${port}/api/room/${roomName}`);
      expect(response.status).toBe(HttpStatusCode.Ok);
      expect(response.data.room).toEqual(
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
            }) as Room['area']['z']
          }) as Room['area'],
          amountOfCoins: expect.any(Number) as number
        }) as Room
      );
    }
  });
});
