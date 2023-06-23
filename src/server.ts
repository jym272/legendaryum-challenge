import { initializeSetup, startSetup } from './setup';
import { log, getEnvOrFail, logServerIsRunning } from '@utils/index';

const { server } = initializeSetup();

const PORT = getEnvOrFail('PORT');

(() => {
  try {
    startSetup(server).listen(PORT, () => logServerIsRunning(PORT));
  } catch (error) {
    log(error);
    process.exitCode = 1;
  }
})();

const listener = () => {
  log('Closing server...');
  process.exit(0);
};

process.on('SIGINT', listener);
process.on('SIGTERM', listener);
