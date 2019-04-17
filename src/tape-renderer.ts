import { HeadersUtil } from './utils/headers';
import MediaType from './utils/media-type';
import { Tape } from './tape';
import { RequestOrResponse } from './types/http';

export default class TapeRenderer {
  private tape: Tape;

  constructor(tape: Tape) {
    this.tape = tape;
  }

  static prepareBody(tape: Tape, reqOrRes: RequestOrResponse, metaPrefix: string) {
    if (tape.meta[`${metaPrefix}HumanReadable`]) {
      const mediaType = new MediaType(reqOrRes);
      const isResAnObject = typeof reqOrRes.body === 'object';

      if (isResAnObject && mediaType.isJSON()) {
        const json = JSON.stringify(reqOrRes.body, null, 2);

        if (HeadersUtil.read(reqOrRes.headers, 'content-length')) {
          HeadersUtil.write(reqOrRes.headers, 'content-length', Buffer.byteLength(json).toString());
        }

        return Buffer.from(json);
      } else {
        return Buffer.from(reqOrRes.body ? reqOrRes.body.toString() : '');
      }
    } else {
      return Buffer.from(reqOrRes.body ? reqOrRes.body.toString() : '', 'base64');
    }
  }

  render() {
    const reqBody = this.bodyFor(this.tape.request);
    const resBody = this.tape.response ? this.bodyFor(this.tape.response) : '<Response is empty>';

    return {
      meta: this.tape.meta,
      request: {
        ...this.tape.request,
        body: reqBody.toString(),
      },
      response: {
        ...this.tape.response,
        body: resBody.toString(),
      },
    };
  }

  bodyFor(reqResObj: RequestOrResponse) {
    const mediaType = new MediaType(reqResObj);

    if (!reqResObj.body) {
      return '';
    }

    const bodyLength = reqResObj.body.length;

    if (mediaType.isHumanReadable() && bodyLength > 0) {
      const rawBody = reqResObj.body;

      if (mediaType.isJSON()) {
        return reqResObj.body.toString();
      } else {
        return rawBody;
      }
    } else {
      return reqResObj.body;
    }
  }
}
