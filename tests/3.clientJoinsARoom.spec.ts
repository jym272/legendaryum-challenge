import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, createApplication, ServerToClientsEvents } from '../src/create';

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
    it('if emit event is successful, callback is executed', done => {
      socket.emit('room:join', 'room1', () => {
        done();
      });
    });
  });
});
