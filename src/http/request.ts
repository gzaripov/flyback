import fetch from 'node-fetch';
import qs from 'query-string';
import MediaFormat from './media-format';
import Headers, { HeadersJson } from './headers';
import Response from './response';
import { Context } from '../context';
import Path from './path';
import BodyCreator from './body/body-creator';
import { Body } from './body';

type RequestParams = {
  path: string;
  method?: string;
  headers: Headers;
  body?: Body | Buffer;
  context: Context;
};

export type QueryParamsObject = { [key: string]: string | string[] | null | undefined };

export type RequestJson = {
  pathname: string;
  query?: QueryParamsObject;
  method: string;
  headers: HeadersJson;
  body?: string | Object;
};

export default class Request {
  public readonly name: string;
  private readonly path: Path;
  private readonly method: string;
  private readonly headers: Headers;
  private readonly mediaFormat: MediaFormat;
  private readonly body?: Body;
  private readonly context: Context;

  constructor({ path, method = 'GET', headers, body, context }: RequestParams) {
    this.context = context;
    this.path = new Path(path, context);
    this.method = method.toUpperCase();
    this.headers = this.deleteHostHeader(headers);
    this.mediaFormat = new MediaFormat(this.headers);
    this.body = this.createBody(body);
    this.name = this.createName();
  }

  private createBody(bodyOrBuffer?: Body | Buffer): Body | undefined {
    const body =
      bodyOrBuffer instanceof Buffer
        ? new BodyCreator(this.mediaFormat).createFromBuffer(bodyOrBuffer)
        : bodyOrBuffer;

    if (!body || body.isEmpty()) {
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
      return this.context.tapeNameGenerator(this.toJson());
    }

    return (
      this.pathname
        // remove trailing slashes
        .replace(/^\/|\/$/g, '')
        .replace(/\//g, '.')
    );
  }

  get pathname(): string {
    return this.path.name;
  }

  get fullPath(): string {
    return this.path.toString();
  }

  async send(endpoint: string) {
    const { path, method, headers, body } = this;
    const url = endpoint.replace(/\/$/, '') + path;

    this.context.logger.log(`Making request to ${url}`);

    const response = await fetch(url, {
      method,
      headers: headers.toJSON() as any,
      body: body && body.toBuffer(),
      compress: false,
      redirect: 'manual',
      agent: this.context.agent,
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

  toJson(): RequestJson {
    const { path, method, headers, body } = this;

    const [pathname, queryString] = path.toString().split('?');
    const query = queryString ? qs.parse(queryString) : undefined;

    return {
      pathname,
      query,
      method,
      headers: headers.toJSON(),
      body: body ? body.toJson() : undefined,
    };
  }

  static fromJson(json: RequestJson, context: Context): Request {
    const { pathname, query, method, body } = json;
    const headers = new Headers(json.headers);
    const path = pathname + (query ? `?${qs.stringify(query)}` : '');

    return new Request({
      path,
      method,
      headers,
      body: body ? new BodyCreator(new MediaFormat(headers)).createFromJson(body) : undefined,
      context,
    });
  }
}
