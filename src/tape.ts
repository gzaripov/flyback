import { Request, Response } from './http';
import { Context } from './context';
import { RequestJson } from './http/request';
import { ResponseJson } from './http/response';

export type TapeJson = {
  request: RequestJson;
  response: ResponseJson;
};

export default class Tape {
  public readonly response: Response;
  private readonly request: Request;
  // @ts-ignore
  private readonly context: Context;

  constructor(request: Request, response: Response, context: Context) {
    this.request = request;
    this.response = response;
    this.context = context;

    if (context.tapeDecorator) {
      const decoratedTapeJson = context.tapeDecorator(this.toJSON());

      return Tape.fromJSON(decoratedTapeJson, { ...context, tapeDecorator: undefined });
    }
  }

  get name() {
    return this.request.name;
  }

  get pathname() {
    return this.request.pathname;
  }

  get path() {
    return this.request.fullPath;
  }

  containsRequest(request: Request) {
    return this.request.equals(request);
  }

  toJSON(): TapeJson {
    const { request, response } = this;

    return {
      request: request.toJSON(),
      response: response.toJSON(),
    };
  }

  static fromJSON(tapeJson: TapeJson, context: Context) {
    const { request, response } = tapeJson;

    return new Tape(Request.fromJSON(request, context), Response.fromJSON(response), context);
  }
}
