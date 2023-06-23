import cluster from 'cluster';
import http from 'http';
import { setupMaster } from '@socket.io/sticky';
import { log, logServerIsRunning } from '@utils/logs';
import { initializeSetup, startSetup } from './setup';
import { getEnvOrFail } from '@utils/env';

const { server } = initializeSetup();
const WORKERS_COUNT = Number(getEnvOrFail('WORKERS_COUNT'));
const PORT = getEnvOrFail('PORT');

const startMasterProcess = () => {
  log(`Master ${process.pid} is running`);

  for (let i = 0; i < WORKERS_COUNT; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    const pid = worker.process.pid ?? 'undefined';
    log(`Worker ${pid} died with code ${code} and signal ${signal}`);
    cluster.fork();
  });

  const expressServer = startSetup(server);
  const httpServer = new http.Server(expressServer);
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection' // either "random", "round-robin" or "least-connection"
  });

  expressServer.listen(PORT, () => logServerIsRunning(PORT));
};

if (cluster.isPrimary) {
  startMasterProcess();
} else {
  log(`Worker ${process.pid} started`);
  require('./index');
}
