import MediaType from './utils/media-type';
import { Tape, SerializedHeaders, SerializedTape } from './tape';
import { RequestOrResponse, Headers } from './http';

export default class TapeRenderer {
  private tape: Tape;

  constructor(tape: Tape) {
    this.tape = tape;
  }

  renderHeaders(headers: Headers) {
    const renderedHeaders: SerializedHeaders = {};

    Object.keys(headers).forEach((header) => {
      const headerValue = headers[header];

      renderedHeaders[header] = headerValue.length > 1 ? headerValue : headerValue[0];
    });

    return renderedHeaders;
  }

  render(): SerializedTape {
    const { meta, request, response } = this.tape;

    return {
      meta,
      request: {
        ...this.tape.request,
        body: this.renderBody(request),
        headers: this.renderHeaders(request.headers),
      },
      response: {
        ...this.tape.response,
        body: this.renderBody(response),
        headers: this.renderHeaders(response.headers),
      },
    };
  }

  renderBody(reqResObj: RequestOrResponse): string | undefined {
    const mediaType = new MediaType(reqResObj);

    if (!reqResObj.body) {
      return undefined;
    }

    const bodyLength = reqResObj.body.length;

    if (mediaType.isHumanReadable() && bodyLength > 0) {
      const rawBody = reqResObj.body;

      if (mediaType.isJSON()) {
        return reqResObj.body.toString();
      } else {
        return rawBody.toString();
      }
    } else {
      return reqResObj.body.toString();
    }
  }
}
