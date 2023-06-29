import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import { createServer, Server } from 'http';
import { Room, ServerConfiguration } from '@custom-types/index';
import { AddressInfo } from 'net';
import Redis from 'ioredis';
import { createPartialDone } from '@utils/testUtils';
import { getRedisClient, initializeSetup, startSetup } from '../../../src/setup';
import { createApplication } from '../../../src/create';

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
  void redisClient.quit(done);
});

describe('/api/rooms endpoint GET', () => {
  it('should return all rooms', async () => {
    const response: AxiosResponse<{ rooms: Room[] }> = await axios.get(`http://localhost:${port}/api/rooms`);

    const rooms = response.data.rooms;

    expect(response.status).toBe(HttpStatusCode.Ok);

    expect(rooms.length).toBe(2);
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
  });
});
