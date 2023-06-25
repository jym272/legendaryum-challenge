import fs from 'fs';
import { getEnvOrFail } from '@utils/env';
import { ServerConfiguration } from '@custom-types/index';
import errors from '@custom-types/errors';
const { CONFIG_FILE_ERROR } = errors;
// TODO: refactorizar en una clase build design pattern

export const getServerConfiguration = (configObject: Partial<ServerConfiguration> = {}) => {
  if (configObject.rooms && configObject.rooms.length > 0) {
    return configObject as ServerConfiguration;
  }
  const configFile = getEnvOrFail('CONFIG_SERVER_FILE');
  try {
    const configData = fs.readFileSync(configFile, 'utf-8');
    return JSON.parse(configData) as ServerConfiguration;
  } catch (error) {
    throw new Error(CONFIG_FILE_ERROR);
  }
};

export const getNameOfTheRooms = (configuration: ServerConfiguration) => {
  return configuration.rooms.map(room => room.name);
};
