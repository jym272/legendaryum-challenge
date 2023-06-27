module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@redis/(.*)$': '<rootDir>/src/redis/$1',
    '^@custom-types/(.*)$': '<rootDir>/src/types/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@events/(.*)$': '<rootDir>/src/events/$1'
  }
};
