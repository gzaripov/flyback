import MediaType from './utils/media-type';
import TapeRenderer from './tape-renderer';
import { Request, Response, Headers } from './http';
import { Context } from './options';

type Meta = {
  createdAt: Date;
  endpoint: string;
  [key: string]: any;
};

export interface SerializedHeaders {
  [header: string]: string | string[];
}

export type SerializedTape = {
  meta: Meta;
  request: {
    url: string;
    method: string;
    headers: SerializedHeaders;
    body?: string;
  };
  response: {
    status: number;
    headers: SerializedHeaders;
    body?: string;
  };
};

export type Tape = {
  meta: Meta;
  request: Request;
  response: Response;
};

function prettifyJSON(json: string): string {
  return JSON.stringify(JSON.parse(json), null, 2);
}

export function createTape(request: Request, response: Response, options: Context): Tape {
  const mediaType = new MediaType(request.headers);

  if (mediaType.isJSON() && request.body && request.body.length > 0) {
    request.body = Buffer.from(prettifyJSON(request.body.toString()));
  }

  return {
    meta: {
      createdAt: new Date(),
      endpoint: options.proxyUrl,
    },
    request,
    response,
  };
}

function createHeadersFromJSON(hds: SerializedHeaders) {
  const headers: Headers = {};

  Object.keys(hds).forEach((header) => {
    const reqHeader = hds[header];

    headers[header] = Array.isArray(reqHeader) ? reqHeader : [reqHeader];
  });

  return headers;
}

export function createTapeFromJSON(serializedTape: SerializedTape): Tape {
  const { meta, request, response } = serializedTape;

  const requestHeaders = createHeadersFromJSON(request.headers);
  const responseHeaders = createHeadersFromJSON(response.headers);

  const requestEncoding = new MediaType(requestHeaders).isHumanReadable() ? 'utf8' : 'base64';
  const responseEncoded = new MediaType(responseHeaders).isHumanReadable() ? 'utf8' : 'base64';

  const requestBody =
    request.body !== undefined ? Buffer.from(request.body, requestEncoding) : undefined;
  const responseBody =
    response.body !== undefined ? Buffer.from(response.body, responseEncoded) : undefined;

  const tape = {
    meta,
    request: {
      ...request,
      body: requestBody,
      headers: requestHeaders,
    },
    response: {
      ...response,
      body: responseBody,
      headers: responseHeaders,
    },
  };

  return tape;
}

export function cloneTape(tape: Tape) {
  const json = new TapeRenderer().renderTape(tape);

  return createTapeFromJSON(json);
}
