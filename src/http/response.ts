import Headers, { HeadersJson } from './headers';
import { ServerResponse } from 'http';
import Body, { PrintableBody } from './body';
import MediaType from './media-type';
import { EncodedBody } from './encoded-body';

type ResponseParams = {
  status: number;
  headers: Headers;
  body?: Body | Buffer;
};

export type ResponseJson = {
  status: number;
  headers: HeadersJson;
  body?: string | Object;
};

export default class Response {
  private readonly status: number;
  private readonly headers: Headers;
  private readonly mediaType: MediaType;
  private readonly body?: Body;

  constructor({ status, headers, body }: ResponseParams) {
    this.status = status;
    this.headers = headers;
    this.mediaType = new MediaType(headers);
    this.body = body instanceof Buffer ? this.createBody(body) : body;

    this.checkHeaders();
  }

  private createBody(data?: Buffer) {
    if (!data) {
      return undefined;
    }

    const body = this.mediaType.isCompressed()
      ? new EncodedBody(data, this.mediaType)
      : new PrintableBody(data, this.mediaType);

    if (body.length === 0) {
      return undefined;
    }

    return body;
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
      body: body ? body.toJson() : '',
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
      body: body ? PrintableBody.fromJson(body, new MediaType(headers)) : undefined,
    });
  }
}
