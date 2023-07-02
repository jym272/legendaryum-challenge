import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { createApplication } from '../src/create';
import { createPartialDone } from '@tests/utils';
import { ClientToServerEvents, ServerConfiguration, ServerIo, ServerToClientsEvents } from '@custom-types/serverTypes';
import Redis from 'ioredis';
import { getRedisClient } from '../src/setup';
import { getRemoteSockets } from '@tests/utils/functions';

let redisClient: Redis, metaverseConfiguration: ServerConfiguration;

beforeAll(done => {
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

describe('second socket from the same client connected', () => {
  let httpServer: Server,
    socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    socket2: Socket<ServerToClientsEvents, ClientToServerEvents>,
    port: number;

  const sessionCredentials = {
    username: 'jorge',
    sessionID: '',
    userID: ''
  };

  beforeEach(done => {
    const partialDone = createPartialDone(3, done);
    httpServer = createServer();
    void redisClient.flushall(partialDone);

    void createApplication(httpServer, {}, metaverseConfiguration).then(() => {
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['polling'] });
        socket.auth = { username: sessionCredentials.username };
        socket.connect();
        socket.on('connect', partialDone);
        socket.on('session', ({ sessionID, userID }) => {
          sessionCredentials.sessionID = sessionID;
          sessionCredentials.userID = userID;
          partialDone();
        });
      });
    });
  });

  afterEach(() => {
    socket.disconnect();
    socket2.disconnect();
    httpServer.close();
  });

  it('second socket connected using sessionId', done => {
    const partialDone = createPartialDone(2, done);

    socket2 = io(`http://localhost:${port}`, {
      auth: { username: sessionCredentials.username, sessionID: sessionCredentials.sessionID },
      transports: ['polling']
    });
    socket2.on('connect', partialDone);

    socket2.on('session', ({ sessionID, userID }) => {
      expect(sessionID).toBe(sessionCredentials.sessionID);
      expect(userID).toBe(sessionCredentials.userID);
      partialDone();
    });
  });
});

describe('two sockets connected', () => {
  let httpServer: Server,
    socket: Socket<ServerToClientsEvents, ClientToServerEvents>,
    socket2: Socket<ServerToClientsEvents, ClientToServerEvents>,
    port: number,
    socketServer: ServerIo;

  const sessionCredentials = {
    username: 'eduardo',
    sessionID: '',
    userID: ''
  };

  beforeEach(done => {
    const partialDone = createPartialDone(4, done);
    httpServer = createServer();
    void redisClient.flushall(partialDone);

    void createApplication(httpServer, {}, metaverseConfiguration).then(({ io: serverIo }) => {
      socketServer = serverIo;
      httpServer.listen(() => {
        port = (httpServer.address() as AddressInfo).port;
        socket = io(`http://localhost:${port}`, {
          auth: { username: sessionCredentials.username },
          transports: ['polling']
        });
        socket.on('connect', partialDone);
        socket.on('session', ({ sessionID, userID }) => {
          sessionCredentials.sessionID = sessionID;
          sessionCredentials.userID = userID;
          socket2 = io(`http://localhost:${port}`, {
            auth: { username: sessionCredentials.username, sessionID: sessionID },
            transports: ['polling']
          });
          socket2.on('connect', partialDone);
          socket2.on('session', partialDone);
        });
      });
    });
  });

  afterEach(() => {
    socket.disconnect();
    socket2.disconnect();
    httpServer.close();
  });

  it('only one socket is disconnected, the connected param is still true in session', async () => {
    const remoteSockets = await getRemoteSockets(socketServer);

    expect(remoteSockets.length).toBe(2);
    expect(remoteSockets[0].id).not.toBe(remoteSockets[1].id);
    expect(sessionCredentials.sessionID).toBe(remoteSockets[0].data.sessionID);
    expect(sessionCredentials.sessionID).toBe(remoteSockets[1].data.sessionID);
    expect(remoteSockets[0].data).toEqual(remoteSockets[1].data);
    expect(remoteSockets[0].rooms.sort()).toEqual([remoteSockets[0].id, sessionCredentials.userID].sort());
    expect(remoteSockets[1].rooms.sort()).toEqual([remoteSockets[1].id, sessionCredentials.userID].sort());

    socket2.disconnect();
    //wait for server to process the disconnection
    await new Promise(resolve => setTimeout(resolve, 30));

    const remoteSocketsAgain = await getRemoteSockets(socketServer);
    expect(remoteSocketsAgain.length).toBe(1);
    expect(remoteSocketsAgain[0].id).toBe(socket.id);

    const persistenceSession = await redisClient.hgetall(`session:${sessionCredentials.sessionID}`);
    expect(persistenceSession).toEqual(
      expect.objectContaining({
        userID: sessionCredentials.userID,
        username: sessionCredentials.username,
        connected: 'true'
      })
    );
  });
  it('the two sockets get disconnected, the connected param is false in session', async () => {
    socket.disconnect();
    socket2.disconnect();
    //wait for server to process the disconnection
    await new Promise(resolve => setTimeout(resolve, 30));

    const remoteSocketsAgain = await getRemoteSockets(socketServer);
    expect(remoteSocketsAgain.length).toBe(0);

    const persistenceSession = await redisClient.hgetall(`session:${sessionCredentials.sessionID}`);

    expect(persistenceSession).toEqual(
      expect.objectContaining({
        userID: sessionCredentials.userID,
        username: sessionCredentials.username,
        connected: 'false'
      })
    );
  });
});
