import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';
import { Coin, Room, ServerConfiguration } from '@custom-types/index';
const ajv = new Ajv();

const coinSchema: JTDSchemaType<Coin> = {
  properties: {
    id: { type: 'int32' },
    position: {
      properties: {
        x: { type: 'int32' },
        y: { type: 'int32' },
        z: { type: 'int32' }
      }
    },
    isAvailable: { type: 'boolean' }
  }
};

const roomSchema: JTDSchemaType<Room> = {
  properties: {
    name: { type: 'string' },
    area: {
      properties: {
        x: {
          properties: {
            max: { type: 'int32' },
            min: { type: 'int32' }
          }
        },
        y: {
          properties: {
            max: { type: 'int32' },
            min: { type: 'int32' }
          }
        },
        z: {
          properties: {
            max: { type: 'int32' },
            min: { type: 'int32' }
          }
        }
      }
    },
    amountOfCoins: { type: 'int32' }
  },
  optionalProperties: {
    coins: {
      elements: coinSchema
    }
  }
};

const schema: JTDSchemaType<ServerConfiguration> = {
  properties: {
    rooms: {
      elements: roomSchema
    }
  }
};

export const serverConfigurationParser = ajv.compileParser(schema);
