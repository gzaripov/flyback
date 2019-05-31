import { Context } from '../../src/options';

export function mockContext(context: Partial<Context> = {}) {
  return context as Context;
}
