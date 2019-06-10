import fs from 'fs';
import os from 'os';
import path from 'path';
import { Context, Options, createContext } from '../../src/context';
import Logger from '../../src/logger';
import Request, { RequestJson } from '../../src/http/request';
import Response, { ResponseJson } from '../../src/http/response';
import Tape from '../../src/tape';

export function mockContext(options: Partial<Options> = {}): Context {
  return createContext(options);
}

export function mockLogger(): Logger {
  return ({
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;
}

export function mockTapesPath(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tapes'));
}

export function mockRequest({
  request = {},
  context = mockContext(),
}: {
  request?: Partial<RequestJson>;
  context?: Context;
} = {}) {
  const requestJson: RequestJson = {
    path: request.path || '/foo/bar/1?real=3',
    method: request.method || 'POST',
    headers: request.headers || {
      accept: 'application/json',
      'content-type': 'text/plain',
      'x-ignored': '1',
    },
    body: request.body || 'ABC',
  };

  return Request.fromJson(requestJson, context);
}

export function mockResponse(response: Partial<ResponseJson> = {}) {
  const responseJson: ResponseJson = {
    status: response.status || 200,
    headers: response.headers || {
      'content-type': 'text/plain',
      'x-ignored': '2',
    },
    body: response.body || 'Hello',
  };

  return Response.fromJson(responseJson);
}

export function mockTape({
  request = {},
  response = {},
  context = mockContext({}),
}: {
  request?: Partial<RequestJson>;
  response?: Partial<ResponseJson>;
  context?: Context;
} = {}) {
  return new Tape(mockRequest({ request, context }), mockResponse(response), context);
}
