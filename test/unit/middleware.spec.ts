import { createFlybackMiddleware } from '../../src/middleware';

describe('middleware', () => {
  it('can create middleware without tapeStoreManager', () => {
    expect(() => createFlybackMiddleware({ proxyUrl: 'test.proxy.com' })).not.toThrowError();
  });
});
