import MediaType from './http/media-type';
import { Tape, SerializedHeaders, TapeJson } from './tape';
import { RequestOrResponse, Headers } from './http';

export default class TapeRenderer {
  private tapes: Tape[];

  constructor(tapes: Tape[] = []) {
    this.tapes = tapes;
  }

  renderHeaders(headers: Headers) {
    const renderedHeaders: SerializedHeaders = {};

    Object.keys(headers).forEach((header) => {
      const headerValue = headers[header];

      renderedHeaders[header] = headerValue.length > 1 ? headerValue : headerValue[0];
    });

    return renderedHeaders;
  }

  render(): TapeJson[] {
    return this.tapes.map((tape) => this.renderTape(tape));
  }

  renderBody(reqResObj: RequestOrResponse): string | undefined {
    const mediaType = new MediaType(reqResObj.headers);
    const body = reqResObj.body;

    if (!body) {
      return undefined;
    }

    const bodyLength = body.length;

    if (mediaType.isHumanReadable() && bodyLength > 0) {
      return body.toString('utf8');
    } else {
      return body.toString('base64');
    }
  }
}
