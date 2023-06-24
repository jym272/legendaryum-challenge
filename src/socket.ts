import { createServer } from 'http';
import Redis from 'ioredis';
import { Server, ServerOptions, Socket } from 'socket.io';
import { setupWorker } from '@socket.io/sticky';
// import crypto from 'crypto';
// import { RedisSessionStore } from './redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { log, logServerIsRunning } from '@utils/logs';
import { getEnvOrFail } from '@utils/env';
import { initializeSetup, startSetup } from './setup';
log(`hello, I am the process with PID: ${process.pid} and I am a worker`);

const PORT = getEnvOrFail('PORT');

const { server } = initializeSetup();
const expressServer = startSetup(server);
const httpServer = createServer({}, expressServer);

// const httpServer = createServer();
const redisClient = new Redis(6767, 'localhost');
// function randomId(): string {
//   return crypto.randomBytes(8).toString('hex');
// }

const serverOptions: Partial<ServerOptions> = {
  cors: {
    // origin: 'http://localhost:8080'
    origin: '*'
  },
  //pubClient Subclient
  adapter: createAdapter(redisClient, redisClient.duplicate())
};

interface SocketData {
  sessionID: string;
  userID: string;
  username: string;
}
const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(httpServer, serverOptions);

// const sessionStore = new RedisSessionStore(redisClient);
// const messageStore = new RedisMessageStore(redisClient);

// io.use(async (socket, next) => {
//   // log th worker id+
//   log(`worker id: ${process.pid}`);
//   log('socket.handshake.auth', socket.handshake.auth);
//   const sessionID = socket.handshake.auth.sessionID as string | undefined;
//   if (sessionID) {
//     const session = await sessionStore.findSession(sessionID);
//     if (session) {
//       socket.data.sessionID = sessionID;
//       socket.data.userID = session.userID;
//       socket.data.username = session.username;
//       next();
//       return;
//     }
//   }
//   const username = socket.handshake.auth.username as string | undefined;
//
//   if (!username) {
//     return next(new Error('invalid username'));
//   }
//   socket.data.sessionID = randomId();
//   socket.data.userID = randomId();
//   socket.data.username = username;
//   next();
// });

const validRooms = ['room1', 'room2', 'room3', 'cool_room'];
// checking if auth.room was provided
io.use(async (socket: Socket, next) => {
  const room = socket.handshake.auth.room as string | undefined;
  if (!room) {
    return next(new Error('no room provided'));
  }
  if (!validRooms.includes(room)) {
    return next(new Error('invalid room'));
  }
  // join the room
  await socket.join(room);
  next();
});

io.on('connection', socket => {
  // persist session

  socket.on('todo:create', () => {
    log('todo:create');
  });
  log('CONNECTION');
  // sessionStore.saveSession(socket.data.sessionID, {
  //   userID: socket.data.userID,
  //   username: socket.data.username,
  //   connected: true
  // });
  //
  // // emit session details
  // socket.emit('session', {
  //   sessionID: socket.data.sessionID,
  //   userID: socket.data.userID
  // });
  //
  // // join the "userID" room
  // await socket.join(socket.data.userID);
  //
  // // fetch existing users
  // // const users = [];
  // // const [messages, sessions] = await Promise.all([
  // //   messageStore.findMessagesForUser(socket.data.userID),
  // //   sessionStore.findAllSessions()
  // // ]);
  // // const messagesPerUser = new Map<string, Message[]>();
  // // messages.forEach(message => {
  // //   const { from, to } = message;
  // //   const otherUser = socket.data.userID === from ? to : from;
  // //   if (messagesPerUser.has(otherUser)) {
  // //     messagesPerUser.get(otherUser).push(message);
  // //   } else {
  // //     messagesPerUser.set(otherUser, [message]);
  // //   }
  // // });
  //
  // // sessions.forEach(session => {
  // //   users.push({
  // //     userID: session.userID,
  // //     username: session.username,
  // //     connected: session.connected,
  // //     messages: messagesPerUser.get(session.userID) || []
  // //   });
  // // });
  // // socket.emit('users', users);
  //
  // // notify existing users
  // socket.broadcast.emit('user connected', {
  //   userID: socket.data.userID,
  //   username: socket.data.username,
  //   connected: true,
  //   messages: []
  // });
  //
  // // forward the private message to the right recipient (and to other tabs of the sender)
  // // socket.on('private message', ({ content, to }) => {
  // //   const message: Message = {
  // //     content,
  // //     from: socket.data.userID,
  // //     to
  // //   };
  // //   socket.to(to).to(socket.data.userID).emit('private message', message);
  // //   messageStore.saveMessage(message);
  // // });
  //
  // // notify users upon disconnection
  // socket.on('disconnect', async () => {
  //   const matchingSockets = await io.in(socket.data.userID).allSockets();
  //   const isDisconnected = matchingSockets.size === 0;
  //   if (isDisconnected) {
  //     // notify other users
  //     socket.broadcast.emit('user disconnected', socket.data.userID);
  //     // update the connection status of the session
  //     sessionStore.saveSession(socket.data.sessionID, {
  //       userID: socket.data.userID,
  //       username: socket.data.username,
  //       connected: false
  //     });
  //   }
  // });
});

httpServer.listen(PORT, () => logServerIsRunning(PORT));

setupWorker(io);

// interface Message {
//   content: string;
//   from: string;
//   to: string;
// }
// nombre del room, un cliente se puede unir al cuarto, pero para
//eso tiene que estar autenticado de alguna manera
