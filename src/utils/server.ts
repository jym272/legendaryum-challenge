import fs from 'fs';
import { ServerConfiguration } from '@custom-types/server';
import { getEnvOrFail } from '@utils/env';

// TODO: refactorizar en una clase build design pattern

export const getServerConfiguration = (configObject: Partial<ServerConfiguration> = {}) => {
  if (Object.keys(configObject).length > 0) {
    return configObject;
  }
  const configFile = getEnvOrFail('CONFIG_SERVER_FILE');
  try {
    const configData = fs.readFileSync(configFile, 'utf-8');
    return JSON.parse(configData) as Partial<ServerConfiguration>;
  } catch (error) {
    throw new Error('configuration server file is not valid');
  }
};
