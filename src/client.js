// testing the socket connection server with socker client

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { io } = require('socket.io-client');

// eslint-disable-next-line no-console
const log = console.log;

const URL = 'http://localhost:8085';
const socket = io(URL, { autoConnect: false, transports: ['websocket'] });
socket.auth = { room: 'cool_room', username: 'jorge' };
// socket.onAny((event, ...args) => {
//   console.log(event, args);
// });
// socket.auth = { username: "jorge" };
socket.connect();
socket.on('connect', () => {
  log('connected');
});

socket.on('disconnect', () => {
  log('disconnected');
});

socket.on('error', err => {
  log(err);
});

socket.on('connect_error', err => {
  log(`connect_error due to ${err.message}`);
});

//wait 5s
// setTimeout(() => {
//   socket.disconnect();
// }, 5000);
