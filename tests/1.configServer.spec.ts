import { createServer, Server } from 'http';
import { createApplication } from '../src/create';
import * as process from 'process';
import { Server as SocketServer } from 'socket.io';
import errors from '@custom-types/errors';

import Redis from 'ioredis';
import { getRedisClient } from '@redis/client';

const {
  ROOMS_WITH_SAME_NAME,
  SCHEMA_NOT_VALID,
  READING_SERVER_CONFIG_FILE,
  MAX_AMOUNT_COINS,
  PARSING_SERVER_CONFIG_FILE
} = errors;

let httpServer: Server;

let redisClient: Redis;

beforeAll(done => {
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

describe('empty server configuration, the configuration is read from a file, the redis server is not initialized', () => {
  beforeEach(() => {
    httpServer = createServer();
  });

  afterEach(() => {
    httpServer.close();
  });
  it('throws an error trying to parse the config server file', async () => {
    process.env.CONFIG_SERVER_FILE = 'jest.config.js';
    await expect(async () => {
      await createApplication(httpServer);
    }).rejects.toThrowError(new RegExp(PARSING_SERVER_CONFIG_FILE));
  });
  it('sending empty rooms, throws an error trying to parse the config server file', async () => {
    process.env.CONFIG_SERVER_FILE = 'jest.config.js';
    await expect(async () => {
      await createApplication(httpServer, {}, { rooms: [] });
    }).rejects.toThrowError(new RegExp(PARSING_SERVER_CONFIG_FILE));
  });
  it('throws an error trying to read a file that does not exists', async () => {
    process.env.CONFIG_SERVER_FILE = 'noFile.json';
    await expect(async () => {
      await createApplication(httpServer);
    }).rejects.toThrowError(new RegExp(READING_SERVER_CONFIG_FILE));
  });
  it('fails because there are rooms with the same name', async () => {
    await expect(async () => {
      await createApplication(
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
    }).rejects.toThrowError(ROOMS_WITH_SAME_NAME);
  });
});
describe('create application function, redis server initialized', () => {
  beforeEach(done => {
    httpServer = createServer();
    void redisClient.flushall(done);
  });

  afterEach(() => {
    httpServer.close();
  });

  it('createApplication success, will retrieve the io SocketServer', async () => {
    const { io } = await createApplication(
      httpServer,
      {},
      {
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
      }
    );
    expect(io).toBeInstanceOf(SocketServer);
  });

  it('generate coins, fails because of max amount of coins', async () => {
    await expect(async () => {
      await createApplication(
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
    }).rejects.toThrowError(MAX_AMOUNT_COINS);
  });

  describe('JSON schema validation', () => {
    it('fails because the min amountOfCoins is 1 ', async () => {
      await expect(async () => {
        await createApplication(
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
                amountOfCoins: 0
              }
            ]
          }
        );
      }).rejects.toThrowError(new RegExp(SCHEMA_NOT_VALID));
    });

    it('fails because the room has an invalid name room length minLength: 2', async () => {
      await expect(async () => {
        await createApplication(
          httpServer,
          {},
          {
            rooms: [
              {
                name: 'A',
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
                amountOfCoins: 20
              }
            ]
          }
        );
      }).rejects.toThrowError(new RegExp(SCHEMA_NOT_VALID));
    });

    it('fails because the room has an invalid name room length maxLength: 20', async () => {
      await expect(async () => {
        await createApplication(
          httpServer,
          {},
          {
            rooms: [
              {
                name: 'longNameRoomWithMoreThan20Characters',
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
                amountOfCoins: 0
              }
            ]
          }
        );
      }).rejects.toThrowError(new RegExp(SCHEMA_NOT_VALID));
    });
  });
});
