import { assertBoolean } from '../../src/utils/asserts';

describe('assertBoolean', () => {
  it('not throws error when is true', () => {
    expect(() => assertBoolean(true, 'error message')).not.toThrowError();
  });

  it('throws error when is false', () => {
    expect(() => assertBoolean(false, 'error message')).toThrowError('error message');
  });
});
