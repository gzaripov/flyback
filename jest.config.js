module.exports = {
  verbose: true,
  cache: true,
  clearMocks: true,
  transform: {
    '^.+\\.ts$': 'babel-jest',
  },
  testRegex: '/test.*(\\.|/)(test|spec)\\.ts$',
  moduleFileExtensions: ['ts', 'json', 'js'],
};
