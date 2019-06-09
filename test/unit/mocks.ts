import { Context } from '../../src/context';
import Logger from '../../src/logger';

export function mockContext(context: Partial<Context> = {}): Context {
  return context as Context;
}

export function mockLogger(): Logger {
  return ({
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;
}
