import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { ClientToServerEvents, Coin, ServerConfiguration, ServerToClientsEvents } from '@custom-types/serverTypes';
import errorsMessages from '@custom-types/errors';
import { createPartialDone } from '@utils/testUtils';
import { log } from '@utils/logs';
const { COIN_NOT_FOUND } = errorsMessages;

describe('client grabs a coin in room orangeRoom in the metaverse', () => {
  let httpServer: Server,
    socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    metaverseConfiguration: ServerConfiguration,
    orangeCoins: Coin[];
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
          amountOfCoins: 20
        }
      ]
    };
  });

  beforeEach(done => {
    const partialDone = createPartialDone(3, done);
    httpServer = createServer();
    createApplication(httpServer, {}, metaverseConfiguration);
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['websocket'] });
      socket.auth = { username: 'user' }; //TODO: validate username in server, it can be differente users!
      socket.connect();
      socket.on('connect', partialDone);
      socket.emit('room:join', 'orangeRoom', () => {
        partialDone();
      });
      socket.on('room:joined', coins => {
        orangeCoins = coins;
        partialDone();
      });
    });
  });

  afterEach(() => {
    httpServer.close();
    socket.disconnect();
  });

  describe('client joins orangeRoom, receive coins', () => {
    it('will receive an error trying to grab a coin with an invalid id', done => {
      const invalidId = 99999999;
      socket.emit('coin:grab', invalidId, res => {
        log(orangeCoins);
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(true);
        const { error } = res as { error: string };
        expect(error).toBe(COIN_NOT_FOUND);
        done();
      });
    });
  });
});
