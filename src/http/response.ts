import Headers, { HeadersJson } from './headers';
import { ServerResponse } from 'http';
import Body, { BodyData } from './body';
import MediaType from './media-type';

type ResponseParams = {
  status: number;
  headers: Headers;
  body?: BodyData;
};

export type ResponseJson = {
  status: number;
  headers: HeadersJson;
  body?: string | Object;
};

export default class Response {
  private readonly status: number;
  private readonly headers: Headers;
  private readonly body?: Body;

  constructor({ status, headers, body }: ResponseParams) {
    this.status = status;
    this.headers = headers;
    this.body = body ? new Body(body, new MediaType(headers)) : undefined;

    this.checkHeaders();
  }

  private checkHeaders() {
    const { headers, body } = this;

    if (body && headers.read('content-length')) {
      headers.write('content-length', body.length.toString());
    }
  }

  toJSON(): ResponseJson {
    const { status, headers, body } = this;

    return {
      status,
      headers: headers.toJSON(),
      body: body ? body.toJSON() : '',
    };
  }

  writeToServerResponse(response: ServerResponse) {
    const { status, headers, body } = this;

    response.writeHead(status, headers.toJSON());
    response.end(body ? body.toBuffer() : undefined);
  }

  static fromJSON(json: ResponseJson) {
    const { status, body } = json;
    const headers = new Headers(json.headers);

    return new Response({
      status,
      headers,
      body: body ? new Body(body, new MediaType(headers)) : undefined,
    });
  }
}
