module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  moduleNameMapper: {
    '^@artha/shared$': '<rootDir>/../shared/src',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@artha/shared)/)'
  ],
  verbose: true,
};
