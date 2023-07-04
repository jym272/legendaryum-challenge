import cluster from 'cluster';
import http from 'http';
import { setupMaster } from '@socket.io/sticky';
import { log } from '@utils/logs';
import { getEnvOrFail } from '@utils/env';
import { initializeSetup, startSetup } from '@config/setupExpress';

const { server } = initializeSetup();
const WORKERS_COUNT = Number(getEnvOrFail('WORKERS_COUNT'));
const startMasterProcess = () => {
  log(`Master ${process.pid} is running`);
  const expressServer = startSetup(server);
  const httpServer = http.createServer({}, expressServer);
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection' // either "random", "round-robin" or "least-connection"
  });

  // httpServer.listen(PORT, () => logServerIsRunning(PORT)); ///asd aname: pull_request_to_dev
  //
  // on:
  //   pull_request:
  //     types: [opened, synchronize, reopened]
  //     paths:
  //       - 'src/**'
  //       - 'tests/**'
  //     branches:
  //       - dev
  //
  // concurrency:
  //   group: ${{ github.workflow }}-${{ github.ref }}
  //   cancel-in-progress: ${{ github.ref != 'refs/heads/master' }}
  //
  // jobs:
  //   code_quality_check:
  //     uses: ./.github/workflows/code-quality-check.yml
  //     secrets: inheritsd

  for (let i = 0; i < WORKERS_COUNT; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    const pid = worker.process.pid ?? 'undefined';
    log(`Worker ${pid} died with code ${code} and signal ${signal}`);
    cluster.fork();
  });
};

if (cluster.isPrimary) {
  startMasterProcess();
} else {
  log(`Worker ${process.pid} started`);
  require('./sockets/server');
}
