import axios, { AxiosResponse } from 'axios';
import { createServer, Server } from 'http';
import { ServerConfiguration } from '@custom-types/serverTypes';
import { createApplication } from '../../src/create';
import { getRedisClient, initializeSetup, startSetup } from '../../src/setup';
import { AddressInfo } from 'net';
import Redis from 'ioredis';

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
      }
    ]
  };
  redisClient = getRedisClient();
  redisClient.on('ready', () => {
    done();
  });
});

beforeEach(done => {
  const { server } = initializeSetup();
  const expressServer = startSetup(server);
  httpServer = createServer({}, expressServer);
  void createApplication(httpServer, {}, metaverseConfiguration).then(() => {
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });
});

afterEach(() => {
  httpServer.close();
});

afterAll(done => {
  void redisClient.quit(done);
});

describe('test the api rest endpoint', () => {
  it('should return "Ticket created." message', async () => {
    const response: AxiosResponse<{ message: string }> = await axios.get(`http://localhost:${port}/api/rooms`);

    expect(response.status).toBe(200); // TODO: complete the test
    // expect(response.data.message).toBe('Ticket created.');
  });
});
