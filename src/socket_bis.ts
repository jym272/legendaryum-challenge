import { createServer } from 'http';
import Redis from 'ioredis';
import { ServerOptions } from 'socket.io';
import { setupWorker } from '@socket.io/sticky';
import { createAdapter } from '@socket.io/redis-adapter';
import { log, logServerIsRunning } from '@utils/logs';
import { getEnvOrFail } from '@utils/env';
import { initializeSetup, startSetup } from './setup';
import { createApplication } from './create';

log(`hello, I am the process with PID: ${process.pid} and I am a worker`);

const PORT = getEnvOrFail('PORT');
const { server } = initializeSetup();
const expressServer = startSetup(server);
const httpServer = createServer({}, expressServer);

const redisClient = new Redis(6767, 'localhost');

const serverOptions: Partial<ServerOptions> = {
  cors: {
    origin: '*'
  },
  adapter: createAdapter(redisClient, redisClient.duplicate())
};

const io = createApplication(httpServer, serverOptions);

httpServer.listen(PORT, () => logServerIsRunning(PORT));

setupWorker(io);
