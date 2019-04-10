import MediaType from './utils/media-type';
import { Options } from './options';
import Tape from './tape';

export default class TapeMatcher {
  private tape: Tape;
  private options: Options;

  constructor(tape: Tape, options: Options) {
    this.tape = tape;
    this.options = options;
  }

  sameAs(otherTape: Tape) {
    if (this.options.tapeMatcher) {
      return this.options.tapeMatcher(this.tape, otherTape);
    }

    const otherReq = otherTape.request;
    const req = this.tape.request;
    const sameURL = req.url === otherReq.url;

    if (!sameURL) {
      this.options.logger.debug(`Not same URL ${req.url} vs ${otherReq.url}`);

      return false;
    }

    const sameMethod = req.method === otherReq.method;

    if (!sameMethod) {
      this.options.logger.debug(`Not same METHOD ${req.method} vs ${otherReq.method}`);

      return false;
    }

    const currentHeadersLength = Object.keys(req.headers).length;
    const otherHeadersLength = Object.keys(otherReq.headers).length;
    const sameNumberOfHeaders = currentHeadersLength === otherHeadersLength;

    if (!sameNumberOfHeaders) {
      this.options.logger.debug(
        `Not same #HEADERS ${JSON.stringify(req.headers)} vs ${JSON.stringify(otherReq.headers)}`,
      );

      return false;
    }

    let headersSame = true;

    Object.keys(req.headers).forEach((k) => {
      const entryHeader = req.headers[k];
      const header = otherReq.headers[k];

      headersSame = headersSame && entryHeader === header;
    });

    if (!headersSame) {
      this.options.logger.debug(
        `Not same HEADERS values ${JSON.stringify(req.headers)} vs ${JSON.stringify(
          otherReq.headers,
        )}`,
      );

      return false;
    }

    if (!req.body && !otherReq.body) {
      return true;
    }

    if (!!req.body !== !!otherReq.body) {
      return false;
    }

    if (!this.options.ignoreBody && req.body && otherReq.body) {
      const mediaType = new MediaType(req);

      let sameBody = false;

      if (mediaType.isJSON() && req.body.length > 0 && otherReq.body.length > 0) {
        sameBody =
          JSON.stringify(JSON.parse(req.body.toString())) ===
          JSON.stringify(JSON.parse(otherReq.body.toString()));
      } else {
        if (req.body instanceof Buffer && otherReq.body instanceof Buffer) {
          sameBody = req.body.equals(otherReq.body);
        } else {
          sameBody = req.body.toString() === otherReq.body.toString();
        }
      }

      if (!sameBody) {
        this.options.logger.debug(`Not same BODY ${req.body} vs ${otherReq.body}`);

        return false;
      }
    }

    return true;
  }
}
