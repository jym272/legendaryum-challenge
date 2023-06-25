import { createServer, Server } from 'http';
import { createApplication } from '../src/create';
import * as process from 'process';
import { Server as SocketServer } from 'socket.io';

describe('config server validation', () => {
  let httpServer: Server;

  beforeEach(() => {
    httpServer = createServer();
  });

  afterEach(() => {
    httpServer.close();
  });

  describe('uses a object for server config instead of a file', () => {
    it('send empty rooms', () => {
      expect(() => {
        createApplication(httpServer, {}, { rooms: [] });
      }).toThrowError('no rooms provided');
    });
    it('send rooms', () => {
      const { io, rooms } = createApplication(
        httpServer,
        {},
        { rooms: ['room1', 'room2', 'room3', 'room4', 'room5', 'room6'] }
      );
      expect(io).toBeInstanceOf(SocketServer);
      expect(rooms).toEqual(['room1', 'room2', 'room3', 'room4', 'room5', 'room6']);
    });
  });
  describe('uses config server file', () => {
    it('throws an error trying to parse the config server file', () => {
      process.env.CONFIG_SERVER_FILE = 'jest.config.js';
      expect(() => {
        createApplication(httpServer);
      }).toThrowError('configuration server file is not valid');
    });
  });
});
