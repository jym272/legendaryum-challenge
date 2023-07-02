import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import { createServer, Server } from 'http';
import { Coin, ServerConfiguration } from '@custom-types/index';
import { AddressInfo } from 'net';
import Redis from 'ioredis';
import { createPartialDone } from '@tests/utils';
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
  void redisClient.quit((err, res) => {
    if (res === 'OK') {
      done();
    }
  });
});

describe('/api/room/:room/coins endpoint GET', () => {
  it('should return all the coins with position generated in the rooms', async () => {
    const roomNames = metaverseConfiguration.rooms.map(room => room.name);

    for await (const roomName of roomNames) {
      const response: AxiosResponse<{ coins: Coin[] }> = await axios.get(
        `http://localhost:${port}/api/room/${roomName}/coins`
      );
      expect(response.status).toBe(HttpStatusCode.Ok);
      expect(response.data.coins.length).toBe(roomName === 'skyRoom' ? 10 : 40);
      expect(response.data.coins).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number) as number,
            isAvailable: expect.any(Boolean) as boolean,
            position: expect.objectContaining({
              x: expect.any(Number) as number,
              y: expect.any(Number) as number,
              z: expect.any(Number) as number
            }) as Coin['position']
          })
        ])
      );
    }
  });
  it('should return an empty array of coins, invalid room', async () => {
    const response: AxiosResponse<{ coins: Coin[] }> = await axios.get(
      `http://localhost:${port}/api/room/invalidRoom/coins`
    );
    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.data.coins.length).toBe(0);
    expect(response.data.coins).toEqual([]);
  });
});
