import MediaType from './http/media-type';
import { Context } from './options';
import { Tape } from './tape';
import { Request, Headers } from './http';

export default class TapeMatcher {
  private tape: Tape;
  private options: Context;

  constructor(tape: Tape, options: Context) {
    this.tape = tape;
    this.options = options;
  }

  matches(request: Request) {
    if (this.options.tapeMatcher) {
      return this.options.tapeMatcher(this.tape, request);
    }

    const otherReq = request;
    const req = this.tape.request;
    const sameURL = this.matchUrls(req.url, otherReq.url);

    if (!sameURL) {
      this.options.logger.debug(`Not same URL ${req.url} vs ${otherReq.url}`);

      return false;
    }

    const sameMethod = req.method === otherReq.method;

    if (!sameMethod) {
      this.options.logger.debug(`Not same METHOD ${req.method} vs ${otherReq.method}`);

      return false;
    }

    const headersSame = this.matchHeaders(req.headers, otherReq.headers);

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
      const mediaType = new MediaType(req.headers);

      let sameBody = false;

      if (mediaType.isJSON() && req.body.length > 0 && otherReq.body.length > 0) {
        sameBody =
          JSON.stringify(JSON.parse(req.body.toString())) ===
          JSON.stringify(JSON.parse(otherReq.body.toString()));
      } else {
        sameBody = req.body.equals(otherReq.body);
      }

      if (!sameBody) {
        this.options.logger.debug(`Not same BODY ${req.body} vs ${otherReq.body}`);

        return false;
      }
    }

    return true;
  }

  matchUrls(url: string, otherUrl: string): boolean {
    const [base, params = ''] = url.split('?');
    const [otherBase, otherParams = ''] = otherUrl.split('?');

    const basesSame = base === otherBase;

    if (this.options.ignoreAllQueryParams && basesSame) {
      return true;
    }

    if (this.options.ignoreQueryParams) {
      const ignoreParams = this.options.ignoreQueryParams;
      const matchParams = params
        .split('&')
        .filter((p) => {
          const paramName = p.split('=')[0];

          return !ignoreParams.includes(paramName);
        })
        .join('');

      const otherMatchParams = otherParams
        .split('&')
        .filter((p) => {
          const paramName = p.split('=')[0];

          return !ignoreParams.includes(paramName);
        })
        .join('');

      return basesSame && matchParams === otherMatchParams;
    }

    return basesSame;
  }

  matchHeaders(headers: Headers, otherHeaders: Headers): boolean {
    if (this.options.ignoreAllHeaders) {
      return true;
    }

    const ignoreHeaders = this.options.ignoreHeaders || [];

    const matchHeaders = Object.keys(headers).filter((header) => !ignoreHeaders.includes(header));

    const otherMatchHeaders = Object.keys(otherHeaders).filter(
      (header) => !ignoreHeaders.includes(header),
    );

    if (matchHeaders.length !== otherMatchHeaders.length) {
      return false;
    }

    return matchHeaders.every((header) => {
      return headers[header].join() === otherHeaders[header].join();
    });
  }
}
