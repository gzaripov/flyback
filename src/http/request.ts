import { URL } from 'url';
import { Headers } from './';

type RequestParams = { url: URL; method?: string; headers: Headers; body?: Buffer };

type RequestJson = {
  url: string;
  method: string;
  headers: Headers;
  body?: string;
};

export default class Request {
  private url: URL;
  private method: string;
  private headers: Headers;
  private body?: Buffer;

  constructor({ url, method = 'GET', headers, body }: RequestParams) {
    this.url = url;
    this.method = method;
    this.headers = headers;
    this.body = body;
  }

  pathname() {
    return this.url.pathname;
  }

  toJSON() {
    const { url, method, headers, body } = this;

    return {
      url: url.toString(),
      method,
      headers,
      body,
    };
  }

  static fromJSON(json: RequestJson) {
    const { url, method, headers, body } = json;

    return new Request({
      url: new URL(url),
      method,
      headers,
      body: body ? Buffer.from(body) : undefined,
    });
  }
}
