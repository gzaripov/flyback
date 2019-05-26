import { Headers } from './';

type RequestParams = { status: number; headers: Headers; body?: Buffer };

type ResponseJson = {
  status: number;
  headers: Headers;
  body?: string;
};

export default class Response {
  private status: number;
  private headers: Headers;
  private body?: Buffer;

  constructor({ status, headers, body }: RequestParams) {
    this.status = status;
    this.headers = headers;
    this.body = body;
  }

  toJSON(): ResponseJson {
    const { status, headers, body } = this;

    return {
      status,
      headers,
      body: body ? body.toString() : undefined,
    };
  }
}
