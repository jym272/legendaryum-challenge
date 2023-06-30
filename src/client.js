// testing the socket connection server with socker client

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { io } = require('socket.io-client');

// eslint-disable-next-line no-console
const log = console.log;

const URL = 'http://localhost:8085';
const socket = io(URL, { autoConnect: false, transports: ['websocket'] });
socket.auth = { username: 'jorge' };
// socket.onAny((event, ...args) => {
//   console.log(event, args);
// });
// socket.auth = { username: "jorge" };
socket.connect();
socket.on('connect', () => {
  log('connected', Date.now());
  //  'room:join': (room: RoomName, callback: (res?: Response<void>) => void) => void;
  // socket.emit('room:join', 'orangeRoom', res => {
  //   if (res.error) {
  //     log('room:join orangeRoom', res.error);
  //   } else {
  //     log('room:join orangeRoom');
  //     socket.emit('coin:grab', { coinID: 70, room: 'orangeRoom' }, res => {
  //       console.log('coin:grab', res);
  //     });
  //   }
  // });
});

socket.on('disconnect', () => {
  log('disconnected');
});

socket.on('rooms', rooms => {
  log('ROOMS', rooms);
});

socket.on('error', err => {
  log(err);
});

socket.on('connect_error', err => {
  log(`connect_error due to ${err.message}`);
});
// listen all events of socket status
// socket.onAny((event, ...args) => {
//   console.log(event, args);
// });
// wait 5s
// setTimeout(() => {
//   socket.disconnect();
// }, 2000);
//
// setTimeout(() => {
//   // socket.disconnect();
// }, 5000);
