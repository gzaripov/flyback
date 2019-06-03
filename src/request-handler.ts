import { Context, validateRecord, validateFallbackMode, RecordMode } from './context';
import TapeStoreManager from './tape-store-manager';
import { Request, Response, Headers } from './http';
import { assertBoolean } from './utils/asserts';
import Tape from './tape';

export default class RequestHandler {
  private tapeStoreManager: TapeStoreManager;
  private context: Context;

  constructor(context: Context, tapeStoreManager?: TapeStoreManager) {
    this.tapeStoreManager = tapeStoreManager || new TapeStoreManager(context);
    this.context = context;
  }

  async findResponse(request: Request, recordMode: RecordMode): Promise<Response> {
    const tapeStore = this.tapeStoreManager.getTapeStore(request);
    const matchingTape = tapeStore.find(request);

    if (recordMode === 'OVERWRITE') {
      const response = await this.makeRealRequest(request);

      const tape = new Tape(request, response, this.context);

      if (matchingTape) {
        tapeStore.delete(matchingTape);
      }

      tapeStore.save(tape);

      return response;
    }

    if (matchingTape) {
      return matchingTape.response;
    }

    if (recordMode === 'NEW') {
      const response = await this.makeRealRequest(request);

      const tape = new Tape(request, response, this.context);

      tapeStore.save(tape);

      return response;
    }

    assertBoolean(recordMode === 'DISABLED', `Invalid recordMode ${recordMode}`);

    return this.onNoRecord(request);
  }

  async handle(req: Request): Promise<Response> {
    const recordMode =
      typeof this.context.recordMode !== 'function'
        ? this.context.recordMode
        : this.context.recordMode(req);

    validateRecord(recordMode);

    if (recordMode === 'PROXY') {
      return await this.makeRealRequest(req);
    }

    const response = await this.findResponse(req, recordMode);

    return response;
  }

  async onNoRecord(req: Request): Promise<Response> {
    const fallbackMode =
      typeof this.context.fallbackMode !== 'function'
        ? this.context.fallbackMode
        : this.context.fallbackMode(req);

    validateFallbackMode(fallbackMode);

    this.context.logger.log(
      `Tape for ${
        req.pathname
      } not found and recording is disabled (fallbackMode: ${fallbackMode})`,
    );

    this.context.logger.debug({
      url: req.pathname,
      request: req.toJSON(),
    });

    if (fallbackMode === 'PROXY') {
      return await this.makeRealRequest(req);
    }

    return new Response({
      status: 404,
      headers: new Headers({ 'content-type': ['text/plain'] }),
      body: Buffer.from('flyback - tape not found'),
    });
  }

  async makeRealRequest(request: Request): Promise<Response> {
    const endpoint = this.context.proxyUrl;

    return request.send(endpoint);
  }
}
