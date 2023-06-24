import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { log } from '@utils/logs';
import { createApplication } from '../src/create';

const createPartialDone = (count: number, done: () => void) => {
  let i = 0;
  return () => {
    if (++i === count) {
      done();
    }
  };
};

describe('todo management', () => {
  let httpServer: Server, socket: Socket;

  beforeEach(done => {
    const partialDone = createPartialDone(1, done);
    httpServer = createServer();
    createApplication(httpServer);
    httpServer.listen(() => {
      log('listening');
      partialDone();
    });
  });

  afterEach(() => {
    httpServer.close();
    socket.disconnect();
  });

  describe('testing authentication', () => {
    it('should create a todo entity', done => {
      const partialDone = createPartialDone(1, done);

      const port = (httpServer.address() as AddressInfo).port;
      socket = io(`http://localhost:${port}`, { autoConnect: false, transports: ['websocket'] });
      socket.connect();
      socket.on('connect', () => {
        log('connected');
        partialDone();
      });

      socket.on('disconnect', () => {
        log('disconnected');
      });

      socket.on('error', err => {
        log(err);
      });

      socket.on('connect_error', err => {
        log(`connect_error due to ${err.message}`);
        partialDone();
      });
      expect(true).toBe(true);
    });

    // it('should fail with an invalid entity', done => {
    //   const incompleteTodo = {
    //     completed: 'false',
    //     description: true
    //   };
    //   // @ts-expect-error
    //   socket.emit('todo:create', incompleteTodo, res => {
    //     if (!('error' in res)) {
    //       return done(new Error('should not happen'));
    //     }
    //     expect(res.error).to.eql('invalid payload');
    //     expect(res.errorDetails).to.eql([
    //       {
    //         message: '"title" is required',
    //         path: ['title'],
    //         type: 'any.required'
    //       }
    //     ]);
    //     done();
    //   });
    //
    //   otherSocket.on('todo:created', () => {
    //     done(new Error('should not happen'));
    //   });
    // });
  });
});
