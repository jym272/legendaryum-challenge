import Ajv, { JSONSchemaType } from 'ajv';
import { Coin, Room } from '@custom-types/appTypes';
import { ServerConfiguration } from '@custom-types/serverTypes';

const coinSchema: JSONSchemaType<Coin> = {
  $id: 'coinSchema.json',
  type: 'object',
  properties: {
    id: { type: 'number' },
    position: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        z: { type: 'number' }
      },
      required: ['x', 'y', 'z'],
      additionalProperties: false
    },
    isAvailable: { type: 'boolean' }
  },
  required: ['id', 'position', 'isAvailable'],
  additionalProperties: false
};

const roomSchema: JSONSchemaType<Room> = {
  $id: 'roomSchema.json',
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 20 },
    area: {
      type: 'object',
      properties: {
        x: {
          type: 'object',
          properties: {
            max: { type: 'number' },
            min: { type: 'number' }
          },
          required: ['max', 'min'],
          additionalProperties: false
        },
        y: {
          type: 'object',
          properties: {
            max: { type: 'number' },
            min: { type: 'number' }
          },
          required: ['max', 'min'],
          additionalProperties: false
        },
        z: {
          type: 'object',
          properties: {
            max: { type: 'number' },
            min: { type: 'number' }
          },
          required: ['max', 'min'],
          additionalProperties: false
        }
      },
      required: ['x', 'y', 'z'],
      additionalProperties: false
    },
    amountOfCoins: { type: 'number', minimum: 1 },
    coins: {
      type: 'array',
      items: {
        type: 'object',
        $ref: 'coinSchema.json',
        required: ['id', 'position', 'isAvailable']
      },
      nullable: true
    }
  },
  required: ['name', 'area', 'amountOfCoins'],
  additionalProperties: false

  // definitions: {
  //   Coin: {
  //     type: 'object',
  //     properties: {
  //       id: { type: 'number' },
  //       position: {
  //         type: 'object',
  //         properties: {
  //           x: { type: 'number' },
  //           y: { type: 'number' },
  //           z: { type: 'number' }
  //         },
  //         required: ['x', 'y', 'z'],
  //         additionalProperties: false
  //       },
  //       isAvailable: { type: 'boolean' }
  //     },
  //     required: ['id', 'position', 'isAvailable'],
  //     additionalProperties: false
  //   }
  // }
};

const schema: JSONSchemaType<ServerConfiguration> = {
  $id: 'serverConfiguration.json',
  type: 'object',
  properties: {
    rooms: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        $ref: 'roomSchema.json',
        required: ['name', 'area', 'amountOfCoins']
      }
    }
  },
  required: ['rooms'],
  additionalProperties: false
};

const ajv = new Ajv({ schemas: [coinSchema, roomSchema, schema] });

const getSchema = <T>(schemaId: string) => {
  const validate = ajv.getSchema<T>(schemaId);
  if (!validate) {
    throw new Error(`Schema ${schemaId} not found`);
  }
  return validate;
};

export const serverConfigurationValidateSchema = getSchema<ServerConfiguration>('serverConfiguration.json');
