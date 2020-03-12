import { createFlybackServer } from './server';
import { createFlybackMiddleware } from './middleware';
import { RecordModes, FallbackModes } from './context';
import { mockMiddleware } from './mock-middleware';
import create from './create';

export {
  create,
  createFlybackServer,
  // @deprecated, will be removed in 4.0
  createFlybackServer as FlybackServer,
  createFlybackMiddleware,
  mockMiddleware,
  RecordModes,
  FallbackModes,
};
