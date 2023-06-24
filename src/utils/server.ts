import fs from 'fs';
import { ServerConfiguration } from '@custom-types/server';

// TODO: refactorizar en una clase build design pattern
export const getServerConfiguration = (configObject: Partial<ServerConfiguration> = {}) => {
  if (Object.keys(configObject).length > 0) {
    return configObject;
  }
  try {
    const configFile = 'config_server.json';
    const configData = fs.readFileSync(configFile, 'utf-8');
    const config = JSON.parse(configData) as Partial<ServerConfiguration>;
    return config;
  } catch (error) {
    throw new Error('config_server.json is not valid');
  }
};
