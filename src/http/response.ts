import Headers from './headers';
import { ServerResponse } from 'http';

type RequestParams = { status: number; headers: Headers; body?: Buffer };

export type ResponseJson = {
  status: number;
  headers: Headers;
  body?: string;
};

export default class Response {
  private readonly status: number;
  private readonly headers: Headers;
  private readonly body?: Buffer;

  constructor({ status, headers, body }: RequestParams) {
    this.status = status;
    this.headers = headers;
    this.body = body;

    this.checkHeaders();
  }

  private checkHeaders() {
    const { headers, body } = this;

    if (body && headers.read('content-length')) {
      headers.write('content-length', body.byteLength.toString());
    }
  }

  toJSON(): ResponseJson {
    const { status, headers, body } = this;

    return {
      status,
      headers,
      body: body ? body.toString() : undefined,
    };
  }

  writeToServerResponse(response: ServerResponse) {
    const { status, headers, body } = this;

    response.writeHead(status, headers.toJSON());
    response.end(body);
  }

  static fromJSON(json: ResponseJson) {
    const { status, headers, body } = json;

    return new Response({
      status,
      headers,
      body: body ? Buffer.from(body) : undefined,
    });
  }
}
