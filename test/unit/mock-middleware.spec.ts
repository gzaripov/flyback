import { mockMiddleware } from '../../src/mock-middleware';
import { EventEmitter } from 'events';
import { IncomingMessage, ServerResponse } from 'http';
import { createRequest, createResponse } from 'node-mocks-http';

describe('Mock middleware', () => {
  it('should not mock request if url not matched', async () => {
    const request = createRequest<IncomingMessage>({
      method: 'GET',
      url: '/test/2',
      eventEmitter: EventEmitter,
    });

    const response = createResponse<ServerResponse>({
      eventEmitter: EventEmitter,
    });

    const nextFn = jest.fn();

    const middleware = mockMiddleware({
      path: '/bff/tvm-session',
      data: { test: { key: 'value' } },
    });

    await middleware(request, response, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
  });

  it('should mock request if url match', async () => {
    const request = createRequest<IncomingMessage>({
      method: 'GET',
      url: '/bff/tvm-session',
      eventEmitter: EventEmitter,
    });

    const response = createResponse<ServerResponse>({
      eventEmitter: EventEmitter,
    });

    const nextFn = jest.fn();

    const middleware = mockMiddleware({
      path: '/bff/tvm-session',
      data: { test: { key: 'value' } },
    });

    await middleware(request, response, nextFn);

    expect(nextFn).not.toHaveBeenCalled();

    expect(response._getData()).toBe('{"test":{"key":"value"}}');
  });

  it('should call nextFn if cant parse path from url and cant match empty string', async () => {
    const request = createRequest<IncomingMessage>({
      method: 'GET',
      url: '',
      eventEmitter: EventEmitter,
    });

    const response = createResponse<ServerResponse>({
      eventEmitter: EventEmitter,
    });

    const nextFn = jest.fn();

    const middleware = mockMiddleware({
      path: '/bff/tvm-session',
      data: { test: { key: 'value' } },
    });

    await middleware(request, response, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });

  it('should work with arrays and regexps as matchers', async () => {
    const request = createRequest<IncomingMessage>({
      method: 'GET',
      url: '/bff/tvm-session',
      eventEmitter: EventEmitter,
    });

    const response = createResponse<ServerResponse>({
      eventEmitter: EventEmitter,
    });

    const nextFn = jest.fn();

    const middleware = mockMiddleware({
      path: [new RegExp('^/bff/tvm-session')],
      data: JSON.stringify({ test: { key: 'value' } }),
    });

    await middleware(request, response, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(response._getData()).toBe('{"test":{"key":"value"}}');
  });

  it('should just finish response if match and data is not passed', async () => {
    const request = createRequest<IncomingMessage>({
      method: 'GET',
      url: '/bff/tvm-session',
      eventEmitter: EventEmitter,
    });

    const response = createResponse<ServerResponse>({
      eventEmitter: EventEmitter,
    });

    const nextFn = jest.fn();

    const middleware = mockMiddleware({
      path: [new RegExp('^/bff/tvm-session')],
    });

    await middleware(request, response, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(response._getData()).toBe('');
  });

  it('should respond with headers if passed and path matched', async () => {
    const request = createRequest<IncomingMessage>({
      method: 'GET',
      url: '/bff/tvm-session',
      eventEmitter: EventEmitter,
    });

    const response = createResponse<ServerResponse>({
      eventEmitter: EventEmitter,
    });

    const nextFn = jest.fn();

    const middleware = mockMiddleware({
      path: [new RegExp('^/bff/tvm-session')],
      headers: {
        'x-test-header': '123',
      },
    });

    await middleware(request, response, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
    expect(response._getData()).toBe('');
    expect(response._getHeaders()).toEqual({
      'x-test-header': '123',
    });
  });

  it('should call nextFn with error if something goes wrong', async () => {
    const request = createRequest<IncomingMessage>({
      method: 'GET',
      url: '/bff/tvm-session',
      eventEmitter: EventEmitter,
    });

    const response = createResponse<ServerResponse>({
      eventEmitter: EventEmitter,
    });

    const error = new Error('Test error');

    response.end = () => {
      throw error;
    };

    const nextFn = jest.fn();

    const middleware = mockMiddleware({
      path: [new RegExp('^/bff/tvm-session')],
      headers: {
        'x-test-header': '123',
      },
    });

    await middleware(request, response, nextFn);

    expect(nextFn).toHaveBeenCalledWith(error);
  });
});
