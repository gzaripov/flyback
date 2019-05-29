import { createTalkbackMiddleware } from '../../src/middleware';

describe('middleware', () => {
  it('can create middleware without tapeStoreManager', () => {
    expect(() => createTalkbackMiddleware({ proxyUrl: 'test.proxy.com' })).not.toThrowError();
  });
});
