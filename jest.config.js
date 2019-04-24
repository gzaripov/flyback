module.exports = {
  verbose: true,
  cache: true,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/types/*.ts'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  transform: {
    '^.+\\.ts$': 'babel-jest',
  },
  testRegex: '/test.*(\\.|/)(test|spec)\\.ts$',
  moduleFileExtensions: ['ts', 'json', 'js'],
  setupFiles: ['<rootDir>/test/setup/setupTests.ts'],
};
