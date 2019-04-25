import MediaType from './utils/media-type';
import { Tape } from './tape';
import { RequestOrResponse } from './http';

export default class TapeRenderer {
  private tape: Tape;

  constructor(tape: Tape) {
    this.tape = tape;
  }

  render() {
    const reqBody = this.bodyFor(this.tape.request);
    const resBody = this.bodyFor(this.tape.response);

    return {
      meta: this.tape.meta,
      request: {
        ...this.tape.request,
        body: reqBody,
      },
      response: {
        ...this.tape.response,
        body: resBody,
      },
    };
  }

  bodyFor(reqResObj: RequestOrResponse): string | undefined {
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
