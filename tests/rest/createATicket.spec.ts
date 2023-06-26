import axios, { AxiosResponse } from 'axios';
import { createServer, Server } from 'http';
import { ServerConfiguration } from '@custom-types/serverTypes';
import { createApplication } from '../../src/create';
import { initializeSetup, startSetup } from '../../src/setup';
import { AddressInfo } from 'net';

let metaverseConfiguration: ServerConfiguration;
let httpServer: Server, port: number;

beforeAll(() => {
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
});

beforeEach(done => {
  const { server } = initializeSetup();
  const expressServer = startSetup(server);
  httpServer = createServer({}, expressServer);
  createApplication(httpServer, {}, metaverseConfiguration);
  httpServer.listen(() => {
    port = (httpServer.address() as AddressInfo).port;
    done();
  });
});

afterEach(() => {
  httpServer.close();
});

describe('test the api rest', () => {
  it('should return "Ticket created." message', async () => {
    const response: AxiosResponse<{ message: string }> = await axios.get(`http://localhost:${port}/api/tickets`);

    expect(response.status).toBe(200);
    expect(response.data.message).toBe('Ticket created.');
  });
});
