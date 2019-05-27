import { Request, Response } from './http';
import { Context } from './options';
import { RequestJson } from './http/request';
import { ResponseJson } from './http/response';

export type TapeJson = {
  request: RequestJson;
  response: ResponseJson;
};

export class Tape {
  public readonly request: Request;
  public readonly response: Response;
  public readonly name: string;
  private context: Context;

  // if (context.tapeDecorator) {
  //   const decoratedTapeJson = context.tapeDecorator(this.toJSON());

  //   return Tape.fromJSON(decoratedTapeJson, context);
  // }

  constructor(request: Request, response: Response, context: Context) {
    this.request = request;
    this.response = response;
    this.context = context;
    this.name = this.createTapeName();
  }

  private createTapeName() {
    const ext = this.context.tapeExtension;

    if (this.context.tapeNameGenerator) {
      const tapeName = this.context.tapeNameGenerator(this.toJSON());

      if (!tapeName.endsWith(`.${ext}`)) {
        return `${tapeName}.${ext}`;
      }

      return tapeName;
    }

    const pathname = this.request.pathname;

    const tapeName = pathname.replace(/\//g, '.');

    return `${tapeName}.${ext}`;
  }

  get pathname() {
    return this.request.pathname;
  }

  toJSON(): TapeJson {
    const { request, response } = this;

    return {
      request: request.toJSON(),
      response: response.toJSON(),
    };
  }

  clone() {
    return Tape.fromJSON(this.toJSON(), this.context);
  }

  static fromJSON(tapeJson: TapeJson, options: Context) {
    const { request, response } = tapeJson;

    return new Tape(Request.fromJSON(request), Response.fromJSON(response), options);
  }
}

// function createHeadersFromJSON(hds: SerializedHeaders) {
//   const headers: Headers = {};

//   Object.keys(hds).forEach((header) => {
//     const reqHeader = hds[header];

//     headers[header] = Array.isArray(reqHeader) ? reqHeader : [reqHeader];
//   });

//   return headers;
// }

// export function createTapeFromJSON(serializedTape: TapeJson) {
//   const { request, response } = serializedTape;

//   const requestHeaders = createHeadersFromJSON(request.headers);
//   const responseHeaders = createHeadersFromJSON(response.headers);

//   const requestEncoding = new MediaType(requestHeaders).isHumanReadable() ? 'utf8' : 'base64';
//   const responseEncoded = new MediaType(responseHeaders).isHumanReadable() ? 'utf8' : 'base64';

//   const requestBody =
//     request.body !== undefined ? Buffer.from(request.body, requestEncoding) : undefined;
//   const responseBody =
//     response.body !== undefined ? Buffer.from(response.body, responseEncoded) : undefined;

// }
