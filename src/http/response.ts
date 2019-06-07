import Headers, { HeadersJson } from './headers';
import { ServerResponse } from 'http';
import { Body } from './body';
import MediaFormat from './media-format';
import { BodyCreator } from './body';

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
    this.body = this.createBody(body);
    this.checkHeaders();
  }

  private createBody(bodyOrBuffer?: Body | Buffer): Body | undefined {
    const body =
      bodyOrBuffer instanceof Buffer
        ? new BodyCreator(this.mediaFormat).createFromBuffer(bodyOrBuffer)
        : bodyOrBuffer;

    if (!body || body.isEmpty()) {
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
      body: body ? new BodyCreator(new MediaFormat(headers)).createFromJson(body) : undefined,
    });
  }
}
