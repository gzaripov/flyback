import { createRequest, createResponse } from 'node-mocks-http';
import { createFlybackMiddleware } from '../../src/middleware';
import { EventEmitter } from 'events';
import { IncomingMessage, ServerResponse } from 'http';
import { RecordModes } from '../../src/context';
import { mockLogger, mockTapesPath } from './mocks';

describe('createFlybackMiddleware', () => {
  it('creates middleware without error', () => {
    expect(() => createFlybackMiddleware({})).not.toThrowError();
  });

  describe('middleware', () => {
    it('middleware calls nextFn without args when error wasnt thrown', async () => {
      const tapesPath = mockTapesPath();

      const middleware = createFlybackMiddleware({
        recordMode: RecordModes.DISABLED,
        tapesPath,
      });

      const request = createRequest<IncomingMessage>({
        method: 'GET',
        url: '/test/2',
        eventEmitter: EventEmitter,
      });

      const response = createResponse<ServerResponse>({
        eventEmitter: EventEmitter,
      });

      const nextFn = jest.fn();

      const requestHandled = middleware(request, response, nextFn);

      request.emit('end');

      await requestHandled;

      expect(nextFn).toBeCalledTimes(1);
      expect(nextFn).toBeCalledWith();
    });

    it('middleware works without nextFn arg', async () => {
      const tapesPath = mockTapesPath();

      const middleware = createFlybackMiddleware({
        recordMode: RecordModes.DISABLED,
        tapesPath,
      });

      const request = createRequest<IncomingMessage>({
        method: 'GET',
        url: '/test/2',
        eventEmitter: EventEmitter,
      });

      const response = createResponse<ServerResponse>({
        eventEmitter: EventEmitter,
      });

      const requestHandled = middleware(request, response);

      request.emit('end');

      await requestHandled;

      expect(requestHandled).resolves.toBe(undefined);
    });

    it('middleware calls nextFn with error that was thrown', async () => {
      const middleware = createFlybackMiddleware({
        proxyUrl: 'http://test.proxy.com',
        logger: mockLogger(),
      });

      const request = createRequest<IncomingMessage>({
        method: 'GET',
        url: '/test/2',
        eventEmitter: EventEmitter,
      });

      const response = createResponse<ServerResponse>({
        eventEmitter: EventEmitter,
      });

      const nextFn = jest.fn();

      const requestHandled = middleware(request, response, nextFn);

      request.emit('end');

      await requestHandled;

      expect(nextFn).toBeCalledTimes(1);
      expect(nextFn).toBeCalledWith(expect.any(Error));
    });
  });
});
