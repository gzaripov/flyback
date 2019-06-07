module.exports = {
  ...require('../../jest.common'),
  displayName: 'e2e',
  testRegex: 'e2e/.*(test|spec).ts$',
  setupFilesAfterEnv: [require.resolve('./setupTests.ts')],
};
