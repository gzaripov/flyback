import MediaType from './utils/media-type';
import TapeRenderer from './tape-renderer';
import { Request, Response, Headers } from './http';
import { Options } from './options';

type Meta = {
  createdAt: Date;
  endpoint: string;
  [key: string]: any;
};

export type SerializedTape = {
  meta: Meta;
  request: {
    url: string;
    method: string;
    headers: Headers;
    body?: string;
  };
  response: {
    status: number;
    headers: Headers;
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

export function createTape(request: Request, response: Response, options: Options): Tape {
  const mediaType = new MediaType(request);

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

export function createTapeFromJSON(serializedTape: SerializedTape): Tape {
  const { meta, request, response } = serializedTape;

  const requestBody = request.body !== undefined ? Buffer.from(request.body) : undefined;
  const responseBody = response.body !== undefined ? Buffer.from(response.body) : undefined;

  const tape = {
    meta,
    request: {
      ...request,
      body: requestBody,
    },
    response: {
      ...response,
      body: responseBody,
    },
  };

  return tape;
}

export function cloneTape(tape: Tape) {
  const json = new TapeRenderer(tape).render();

  return createTapeFromJSON(json);
}
