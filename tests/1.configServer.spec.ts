import { createServer, Server } from 'http';
import { createApplication } from '../src/create';
import * as process from 'process';
import { Server as SocketServer } from 'socket.io';
import errors from '@custom-types/errors';
import { ServerConfiguration } from '@custom-types/serverTypes';
import { getNameOfTheRooms } from '@utils/serverUtils';
const { ROOMS_WITH_SAME_NAME, READING_SERVER_CONFIG_FILE, MAX_AMOUNT_COINS, PARSING_SERVER_CONFIG_FILE } = errors;

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

  describe('empty server configuration, the configuration is read from a file', () => {
    it('throws an error trying to parse the config server file', () => {
      process.env.CONFIG_SERVER_FILE = 'jest.config.js';
      expect(() => {
        createApplication(httpServer);
      }).toThrowError(new RegExp(PARSING_SERVER_CONFIG_FILE));
    });
    it('sending empty rooms, throws an error trying to parse the config server file', () => {
      process.env.CONFIG_SERVER_FILE = 'jest.config.js';
      expect(() => {
        createApplication(httpServer, {}, { rooms: [] });
      }).toThrowError(new RegExp(PARSING_SERVER_CONFIG_FILE));
    });
    it('throws an error trying to read a file that does not exists', () => {
      process.env.CONFIG_SERVER_FILE = 'noFile.json';
      expect(() => {
        createApplication(httpServer);
      }).toThrowError(READING_SERVER_CONFIG_FILE);
    });
  });
  describe('valid server configuration while creating the application', () => {
    it('will retrieve the io SocketServer and the rooms', () => {
      const { io, rooms } = createApplication(httpServer, {}, metaverseConfiguration);
      expect(io).toBeInstanceOf(SocketServer);
      expect(rooms).toEqual(getNameOfTheRooms(metaverseConfiguration)); //TODO , en el refactor cuando haya base de datos, de seguro cambia
    });
  });
  describe('generate coins', () => {
    it('fails because of max amount of coins', () => {
      expect(() => {
        createApplication(
          httpServer,
          {},
          {
            rooms: [
              {
                name: 'packedRoom',
                area: {
                  x: {
                    max: 5,
                    min: 0
                  },
                  y: {
                    max: 5,
                    min: 0
                  },
                  z: {
                    max: 5,
                    min: 0
                  }
                },
                amountOfCoins: 217
              }
            ]
          }
        );
      }).toThrowError(MAX_AMOUNT_COINS);
    });
  });
  describe('rooms with same name', () => {
    it('fails because there are rooms with the same name', () => {
      expect(() => {
        createApplication(
          httpServer,
          {},
          {
            rooms: [
              {
                name: 'cleanRoom',
                area: {
                  x: {
                    max: 5,
                    min: 0
                  },
                  y: {
                    max: 5,
                    min: 0
                  },
                  z: {
                    max: 5,
                    min: 0
                  }
                },
                amountOfCoins: 8
              },
              {
                name: 'cleanRoom',
                area: {
                  x: {
                    max: 15,
                    min: 0
                  },
                  y: {
                    max: 15,
                    min: 0
                  },
                  z: {
                    max: 5,
                    min: 0
                  }
                },
                amountOfCoins: 10
              }
            ]
          }
        );
      }).toThrowError(ROOMS_WITH_SAME_NAME);
    });
  });
});
