import MediaType from './utils/media-type';
import TapeRenderer from './tape-renderer';
import { Request, Response } from './types/http';
import { Options } from './options';

type Meta = {
  createdAt: Date;
  endpoint: string;
  [key: string]: any;
};

export default class Tape {
  public meta: Meta;
  public request: Request;
  public response?: Response;
  public new = false;
  public used = false;
  public path?: string;

  private options: Options;

  constructor(req: Request, options: Options) {
    this.request = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body,
    };
    this.options = options;
    this.normalizeBody();
    this.meta = {
      createdAt: new Date(),
      endpoint: this.options.proxyUrl,
    };
  }

  normalizeBody() {
    const mediaType = new MediaType(this.request);

    if (mediaType.isJSON() && this.request.body && this.request.body.length > 0) {
      this.request.body = Buffer.from(
        JSON.stringify(JSON.parse(this.request.body.toString()), null, 2),
      );
    }
  }

  clone() {
    const json = new TapeRenderer(this).render();

    return Tape.fromJSON(json, this.options);
  }

  toJSON() {
    return {
      meta: this.meta,
      request: this.request,
      response: this.response,
    };
  }

  static fromJSON(json: any, options: Options) {
    const tape = new Tape(json.request, options);

    tape.meta = json.meta;
    tape.response = json.reponse;

    if (tape.response) {
      tape.response.body = TapeRenderer.prepareBody(tape, tape.response, 'res');
    }

    return tape;
  }
}
