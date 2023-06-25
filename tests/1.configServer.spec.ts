import { createServer, Server } from 'http';
import { createApplication } from '../src/create';
import * as process from 'process';
import { Server as SocketServer } from 'socket.io';
import errors from '@custom-types/errors';
import { ServerConfiguration } from '@custom-types/serverTypes';
import { getNameOfTheRooms } from '@utils/serverUtils';
const { CONFIG_FILE_ERROR } = errors;

describe('create application function', () => {
  let httpServer: Server, metaverseConfiguration: ServerConfiguration;

  beforeAll(() => {
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
          amountOfCoins: 10
        }
      ]
    };
  });

  beforeEach(() => {
    httpServer = createServer();
  });

  afterEach(() => {
    httpServer.close();
  });

  describe('empty server configuration and invalid server config file', () => {
    it('throws an error trying to parse the config server file', () => {
      process.env.CONFIG_SERVER_FILE = 'jest.config.js';
      expect(() => {
        createApplication(httpServer);
      }).toThrowError(CONFIG_FILE_ERROR);
    });
    it('throws an error trying to parse the config server file sending empty rooms', () => {
      process.env.CONFIG_SERVER_FILE = 'jest.config.js';
      expect(() => {
        createApplication(httpServer, {}, { rooms: [] });
      }).toThrowError(CONFIG_FILE_ERROR);
    });
  });
  describe('valid server configuration while creating the application', () => {
    it('will retrieve the io SocketServer and the rooms', () => {
      const { io, rooms } = createApplication(httpServer, {}, metaverseConfiguration);
      expect(io).toBeInstanceOf(SocketServer);
      expect(rooms).toEqual(getNameOfTheRooms(metaverseConfiguration));
    });
  });
});
