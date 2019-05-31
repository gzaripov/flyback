import { Request, Response } from './http';
import { Context } from './options';
import { RequestJson } from './http/request';
import { ResponseJson } from './http/response';

export type TapeJson = {
  request: RequestJson;
  response: ResponseJson;
};

export default class Tape {
  public readonly request: Request;
  public readonly response: Response;
  public readonly name: string;
  private readonly context: Context;

  constructor(request: Request, response: Response, context: Context) {
    this.request = request;
    this.response = response;
    this.context = context;
    this.name = this.createTapeName();

    if (context.tapeDecorator) {
      const decoratedTapeJson = context.tapeDecorator(this.toJSON());

      return Tape.fromJSON(decoratedTapeJson, { ...context, tapeDecorator: undefined });
    }
  }

  private createTapeName() {
    if (this.context.tapeNameGenerator) {
      return this.context.tapeNameGenerator(this.toJSON());
    }

    return this.request.pathname.substring(1).replace(/\//g, '.');
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

  static fromJSON(tapeJson: TapeJson, context: Context) {
    const { request, response } = tapeJson;

    return new Tape(Request.fromJSON(request, context), Response.fromJSON(response), context);
  }
}
