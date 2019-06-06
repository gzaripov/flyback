import Headers, { HeadersJson } from './headers';
import { ServerResponse } from 'http';
import Body, { PrintableBody } from './body';
import MediaFormat from './media-format';
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
  private readonly mediaFormat: MediaFormat;
  private readonly body?: Body;

  constructor({ status, headers, body }: ResponseParams) {
    this.status = status;
    this.headers = headers;
    this.mediaFormat = new MediaFormat(headers);
    this.body = body instanceof Buffer ? this.createBody(body) : body;

    this.checkHeaders();
  }

  private createBody(data?: Buffer) {
    if (!data) {
      return undefined;
    }

    const body = this.mediaFormat.isEncoded()
      ? new EncodedBody(data, this.mediaFormat)
      : new PrintableBody(data, this.mediaFormat);

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
      body: body ? PrintableBody.fromJson(body, new MediaFormat(headers)) : undefined,
    });
  }
}
