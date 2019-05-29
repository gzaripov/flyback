import fetch from 'node-fetch';
import { Agent } from 'https';
import MediaType from './media-type';
import Headers, { HeadersJson } from './headers';
import Response from './response';
import { Context } from '../options';
import Body from './body';
import Path from './path';

type RequestParams = {
  path: string;
  method?: string;
  headers: Headers;
  body?: Buffer;
  context: Context;
};

export type RequestJson = {
  path: string;
  method: string;
  headers: HeadersJson;
  body?: string;
};

export default class Request {
  private readonly path: Path;
  private readonly method: string;
  private readonly headers: Headers;
  private readonly body?: Body;
  private readonly context: Context;

  constructor({ path, method = 'GET', headers, body, context }: RequestParams) {
    this.path = new Path(path, context);
    this.method = method.toUpperCase();
    this.headers = headers;
    this.body = body && new Body(body, new MediaType(this.headers));
    this.context = context;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new Error('GET or HEAD request cannot contain body');
    }

    this.deleteHostHeader();
  }

  private deleteHostHeader() {
    // delete host header to avoid errors i.e. Domain not found: localhost:9001
    this.headers.delete('host');
  }

  get pathname(): string {
    return this.path.name;
  }

  async send(endpoint: string, params: { agent?: Agent }) {
    const { path, method, headers, body } = this;
    const { agent } = params;

    const url = endpoint.replace(/\/$/, '') + path;

    this.context.logger.log(`Making request to ${url}`);

    const response = await fetch(url, {
      method,
      headers: headers as any,
      body: body && body.toBuffer(),
      compress: false,
      redirect: 'manual',
      agent,
    });

    const responseBody = await response.buffer();

    return new Response({
      status: response.status,
      headers: new Headers(response.headers.raw()),
      body: responseBody,
    });
  }

  equals(otherRequest: Request): boolean {
    const { logger, ignoreAllHeaders, ignoreHeaders, ignoreBody } = this.context;

    if (!this.path.equals(otherRequest.path)) {
      logger.debug(`Not same URL ${this.path.toString()} vs ${otherRequest.path.toString()}`);

      return false;
    }

    if (this.method !== otherRequest.method) {
      logger.debug(`Not same METHOD ${this.method} vs ${otherRequest.method}`);

      return false;
    }

    if (!(ignoreAllHeaders || this.headers.equals(otherRequest.headers, { ignoreHeaders }))) {
      logger.debug(
        `Not same HEADERS values ${this.headers.toJSON()} vs ${otherRequest.headers.toJSON()}`,
      );

      return false;
    }

    if (ignoreBody || (this.body === undefined && otherRequest.body === undefined)) {
      return true;
    }

    if (this.body && otherRequest.body) {
      return this.body.equals(otherRequest.body);
    }

    return typeof this.body !== typeof otherRequest.body;
  }

  toJSON(): RequestJson {
    const { path, method, headers, body } = this;

    return {
      path: path.toString(),
      method,
      headers: headers.toJSON(),
      body: body ? body.toString() : undefined,
    };
  }

  static fromJSON(json: RequestJson, context: Context): Request {
    const { path, method, headers, body } = json;

    return new Request({
      path,
      method,
      headers: new Headers(headers),
      body: body ? Buffer.from(body) : undefined,
      context,
    });
  }
}
