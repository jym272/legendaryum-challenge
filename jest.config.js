/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // transform: {
  //   '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }]
  // },
  moduleNameMapper: {
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@sockets/(.*)$': '<rootDir>/src/sockets/$1',
    '^@redis/(.*)$': '<rootDir>/src/redis/$1',
    '^@custom-types/(.*)$': '<rootDir>/src/types/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1'
  }
};
