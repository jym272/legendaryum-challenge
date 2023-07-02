import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import { createServer, Server } from 'http';
import { Coin, ServerConfiguration } from '@custom-types/index';
import { AddressInfo } from 'net';
import Redis from 'ioredis';
import { initializeSetup, startSetup, createApplication } from '@config/index';
import { getRedisClient } from '@redis/client';
import errorsMessages from '@custom-types/errors';
import { createPartialDone } from '@tests/utils';
const { INVALID_COIN_ID, COIN_NOT_FOUND } = errorsMessages;

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

afterAll(done => {
  void redisClient.quit((err, res) => {
    if (res === 'OK') {
      done();
    }
  });
});

describe('/api/room/:room/coins/:id endpoint GET', () => {
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

  it('should return BadRequest with invalid coin id', async () => {
    try {
      await axios.get(`http://localhost:${port}/api/room/skyRoom/coins/invalidId`);
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      expect(error.response?.status).toBe(HttpStatusCode.BadRequest);
      expect(error.response?.data).toEqual(
        expect.objectContaining({
          error: INVALID_COIN_ID
        })
      );
    }
  });

  it('should return NotFound with coin not found', async () => {
    try {
      await axios.get(`http://localhost:${port}/api/room/hellRoom/coins/10`);
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      expect(error.response?.status).toBe(HttpStatusCode.NotFound);
      expect(error.response?.data).toEqual(
        expect.objectContaining({
          error: COIN_NOT_FOUND
        })
      );
    }
  });

  it('should return the coin', async () => {
    const response: AxiosResponse<{ coin: Coin }> = await axios.get(
      `http://localhost:${port}/api/room/skyRoom/coins/2`
    );
    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.data.coin).toEqual(
      expect.objectContaining({
        id: 2,
        position: expect.objectContaining({
          x: expect.any(Number) as number,
          y: expect.any(Number) as number,
          z: expect.any(Number) as number
        }) as Coin['position'],
        isAvailable: true
      })
    );
  });
});
