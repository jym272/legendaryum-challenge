import { log, logServerIsRunning } from '@utils/logs';
import { getEnvOrFail } from '@utils/env';
import { initializeSetup, startSetup } from './setup';
import http from 'http';

log(`hello, I am the process with PID: ${process.pid} and I am a worker`);
const PORT = getEnvOrFail('PORT');

const { server } = initializeSetup();
const expressServer = startSetup(server);
const httpServer = http.createServer({}, expressServer);
httpServer.listen(PORT, () => logServerIsRunning(PORT));
