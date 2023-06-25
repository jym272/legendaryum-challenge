import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { ClientToServerEvents, ServerToClientsEvents } from '@custom-types/serverTypes';
import errorsMessages from '@custom-types/errors';
const { INVALID_ROOM } = errorsMessages;
describe('client joins a room in the metaverse', () => {
  let httpServer: Server, socket: Socket<ServerToClientsEvents, ClientToServerEvents>, metaverseRooms: string[];
  beforeAll(() => {
    metaverseRooms = ['room1', 'room2', 'room3', 'room4', 'room5', 'room6'];
  });

  beforeEach(done => {
    httpServer = createServer();
    createApplication(httpServer, {}, { rooms: metaverseRooms });
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['websocket'] });
      socket.auth = { username: 'user' };
      socket.connect();
      socket.on('connect', done);
    });
  });

  afterEach(() => {
    httpServer.close();
    socket.disconnect();
  });

  describe('client emits room:join event after successful connection ', () => {
    it('invalid room provided, callback is executed and return an error', done => {
      socket.emit('room:join', 'invalid_room', res => {
        expect(res).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because we are testing for it
        expect('error' in res!).toBe(true);
        const { error } = res as { error: string };
        expect(error).toBe(INVALID_ROOM);
        done();
      });
    });

    it('if emit event is successful, callback is executed', done => {
      socket.emit('room:join', 'room1', res => {
        expect(res).toBeUndefined();
        done();
      });
    });
  });
});
