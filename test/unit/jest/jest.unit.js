module.exports = {
  ...require('../../jest.common.js'),
  displayName: 'unit',
  testRegex: 'unit/.*(test|spec).ts$',
  setupFilesAfterEnv: [require.resolve('./setupTests.ts')],
};
