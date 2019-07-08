import { createFlybackServer } from './server';
import { createFlybackMiddleware } from './middleware';
import { RecordModes, FallbackModes } from './context';
import create from './create';

export { createFlybackServer, createFlybackMiddleware, RecordModes, FallbackModes };

export default {
  create,
  createServer: createFlybackServer,
  createMiddleware: createFlybackMiddleware,
};
