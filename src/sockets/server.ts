import { createServer } from 'http';
import { ServerOptions } from 'socket.io';
import { setupWorker } from '@socket.io/sticky';
import { createAdapter } from '@socket.io/redis-adapter';
import { log, logServerIsRunning } from '@utils/logs';
import { getEnvOrFail } from '@utils/env';
import { initializeSetup, startSetup, createApplication } from '@config/index';

log(`hello, I am the process with PID: ${process.pid} and I am a worker`);

const PORT = getEnvOrFail('PORT');
const { server, redisServer } = initializeSetup();
const expressServer = startSetup(server);
const httpServer = createServer({}, expressServer);

const serverOptions: Partial<ServerOptions> = {
  cors: {
    origin: '*'
  },
  adapter: createAdapter(redisServer, redisServer.duplicate())
};

void (async () => {
  const { io } = await createApplication(httpServer, serverOptions);
  httpServer.listen(PORT, () => logServerIsRunning(PORT));
  setupWorker(io);
})();
