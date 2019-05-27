import fetch from 'node-fetch';
import { Agent } from 'https';
import MediaType from './media-type';
import formatJson from '../utils/format-json';
import Headers, { HeadersJson } from './headers';
import Response from './response';

type RequestParams = { path: string; method?: string; headers: Headers; body?: Buffer };

export type RequestJson = {
  path: string;
  method: string;
  headers: HeadersJson;
  body?: string;
};

export default class Request {
  private readonly path: string;
  private readonly method: string;
  private readonly headers: Headers;
  private readonly body?: Buffer;

  constructor({ path, method = 'GET', headers, body }: RequestParams) {
    this.path = this.normalizePath(path);
    this.method = method.toUpperCase();
    this.headers = headers;
    this.body = this.normalizeBody(body);

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new Error('GET or HEAD request cannot contain body');
    }

    this.deleteHostHeader();
  }

  private normalizePath(path: string) {
    if (!path.startsWith('/')) {
      return `/${path}`;
    }

    return path;
  }

  private normalizeBody(body?: Buffer) {
    const mediaType = new MediaType(this.headers);

    if (mediaType.isJSON() && body && body.length > 0) {
      return Buffer.from(formatJson(body.toString()));
    }

    return body;
  }

  private deleteHostHeader() {
    // delete host header to avoid errors i.e. Domain not found: localhost:9001
    this.headers.delete('host');
  }

  get pathname(): string {
    return this.path.split('?')[0];
  }

  async send(endpoint: string, params: { agent?: Agent }) {
    const { path, method, headers, body } = this;
    const { agent } = params;

    const url = endpoint.replace(/\/$/, '') + path;

    // this.context.logger.log(`Making request to ${url}`);

    const response = await fetch(url, {
      method,
      headers: headers as any,
      body,
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

  toJSON(): RequestJson {
    const { path, method, headers, body } = this;

    return {
      path,
      method,
      headers: headers.toJSON(),
      body: body ? body.toString() : undefined,
    };
  }

  static fromJSON(json: RequestJson): Request {
    const { path, method, headers, body } = json;

    return new Request({
      path,
      method,
      headers: new Headers(headers),
      body: body ? Buffer.from(body) : undefined,
    });
  }
}
