import fetch from 'node-fetch';
import { Agent } from 'https';
import MediaType from './media-type';
import Headers, { HeadersJson } from './headers';
import Response from './response';
import { Context } from '../context';
import Body, { BodyData } from './body';
import Path from './path';

type RequestParams = {
  path: string;
  method?: string;
  headers: Headers;
  body?: BodyData;
  context: Context;
};

export type RequestJson = {
  path: string;
  method: string;
  headers: HeadersJson;
  body?: string | Object;
};

export default class Request {
  public readonly name: string;
  private readonly path: Path;
  private readonly method: string;
  private readonly headers: Headers;
  private readonly body?: Body;
  private readonly context: Context;

  constructor({ path, method = 'GET', headers, body, context }: RequestParams) {
    this.context = context;
    this.path = new Path(path, context);
    this.method = method.toUpperCase();
    this.headers = this.deleteHostHeader(headers);
    this.body = this.createBody(body);
    this.name = this.createName();
  }

  private createBody(data?: BodyData) {
    if (!data) {
      return undefined;
    }

    const body = new Body(data, new MediaType(this.headers));

    if (body.length === 0) {
      return undefined;
    }

    if (this.method === 'GET' || this.method === 'HEAD') {
      throw new Error('Request with GET/HEAD method cannot have body');
    }

    return body;
  }

  private deleteHostHeader(headers: Headers) {
    // delete host header to avoid errors i.e. Domain not found: localhost:9001
    headers.delete('host');

    return headers;
  }

  private createName() {
    if (this.context.tapeNameGenerator) {
      return this.context.tapeNameGenerator(this.toJSON());
    }

    return this.pathname.substring(1).replace(/\//g, '.');
  }

  get pathname(): string {
    return this.path.name;
  }

  get fullPath(): string {
    return this.path.toString();
  }

  async send(endpoint: string, params: { agent?: Agent }) {
    const { path, method, headers, body } = this;
    const { agent } = params;

    const url = endpoint.replace(/\/$/, '') + path;

    this.context.logger.log(`Making request to ${url}`);

    const response = await fetch(url, {
      method,
      headers: headers.toJSON() as any,
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
      body: body ? body.toJSON() : '',
    };
  }

  static fromJSON(json: RequestJson, context: Context): Request {
    const { path, method, body } = json;
    const headers = new Headers(json.headers);

    return new Request({
      path,
      method,
      headers,
      body: body ? new Body(body, new MediaType(headers)) : undefined,
      context,
    });
  }
}
