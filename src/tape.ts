import { Request, Response } from './http';
import { Context } from './context';
import { RequestJson } from './http/request';
import { ResponseJson } from './http/response';

export type TapeJson = {
  request: RequestJson;
  response: ResponseJson;
};

export default class Tape {
  public readonly request: Request;
  public readonly response: Response;
  // @ts-ignore
  private readonly context: Context;

  constructor(request: Request, response: Response, context: Context) {
    this.request = request;
    this.response = response;
    this.context = context;

    if (context.tapeDecorator) {
      const decoratedTapeJson = context.tapeDecorator(this.toJson());

      return Tape.fromJson(decoratedTapeJson, { ...context, tapeDecorator: undefined });
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

  toJson(): TapeJson {
    const { request, response } = this;

    return {
      request: request.toJson(),
      response: response.toJson(),
    };
  }

  static fromJson(tapeJson: TapeJson, context: Context) {
    const { request, response } = tapeJson;

    return new Tape(Request.fromJson(request, context), Response.fromJson(response), context);
  }
}
