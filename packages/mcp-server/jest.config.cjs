module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  transform: {},
  collectCoverageFrom: [],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [],
  moduleNameMapper: {},
  testPathIgnorePatterns: [
    '.*\\.ts$',
    'node_modules'
  ]
};
