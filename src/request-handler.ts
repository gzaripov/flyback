import fetch, { Headers as FetchHeaders } from 'node-fetch';
import { createTape, cloneTape } from './tape';
import { validateRecord, validateFallbackMode, Context, RecordMode } from './options';
import TapeStoreManager from './tape-store-manager';
import { Request, Response } from './http';
import { Tape } from './tape';
import { assertBoolean } from './utils/asserts';
export default class RequestHandler {
  private tapeStoreManager: TapeStoreManager;
  private options: Context;

  constructor(options: Context, tapeStoreManager?: TapeStoreManager) {
    this.tapeStoreManager = tapeStoreManager || new TapeStoreManager(options);
    this.options = options;
  }

  async findTape(req: Request, recordMode: RecordMode): Promise<Tape> {
    const tapeStore = this.tapeStoreManager.getTapeStore(req);
    const matchingTape = tapeStore.find(req);

    if (recordMode === 'OVERWRITE') {
      const res = await this.makeRealRequest(req);

      const tape = createTape(req, res, this.options);

      tapeStore.save(tape);

      return tape;
    }

    if (matchingTape) {
      return matchingTape;
    }

    if (recordMode === 'NEW') {
      const res = await this.makeRealRequest(req);

      const tape = createTape(req, res, this.options);

      tapeStore.save(tape);

      return tape;
    }

    assertBoolean(recordMode === 'DISABLED', `Invalid recordMode ${recordMode}`);

    const res = await this.onNoRecord(req);

    return createTape(req, res, this.options);
  }

  async handle(req: Request): Promise<Response> {
    const recordMode =
      typeof this.options.recordMode !== 'function'
        ? this.options.recordMode
        : this.options.recordMode(req);

    validateRecord(recordMode);

    const tape = await this.findTape(req, recordMode);

    if (this.options.tapeDecorator) {
      const resTape = this.options.tapeDecorator(cloneTape(tape));

      if (resTape.response.body && resTape.response.headers['content-length']) {
        resTape.response.headers['content-length'] = [resTape.response.body.byteLength.toString()];
      }

      return resTape.response;
    }

    return tape.response;
  }

  async onNoRecord(req: Request): Promise<Response> {
    const fallbackMode =
      typeof this.options.fallbackMode !== 'function'
        ? this.options.fallbackMode
        : this.options.fallbackMode(req);

    validateFallbackMode(fallbackMode);

    this.options.logger.log(
      `Tape for ${req.url} not found and recording is disabled (fallbackMode: ${fallbackMode})`,
    );
    this.options.logger.log({
      url: req.url,
      headers: req.headers,
    });

    if (fallbackMode === 'PROXY') {
      return await this.makeRealRequest(req);
    }

    return {
      status: 404,
      headers: { 'content-type': ['text/plain'] },
      body: Buffer.from('talkback - tape not found'),
    };
  }

  async makeRealRequest(req: Request): Promise<Response> {
    let { body } = req;
    const { method, url } = req;

    // delete host header to avoid errors i.e. Domain not found: localhost:9001
    delete req.headers.host;

    const headers = ({ ...req.headers } as any) as FetchHeaders;

    const endpoint = this.options.proxyUrl;

    this.options.logger.log(`Making real request to ${endpoint}${url}`);

    if (method === 'GET' || method === 'HEAD') {
      body = undefined;
    }

    const agent = this.options.agent || undefined;
    const fRes = await fetch(endpoint + url, {
      method,
      headers,
      body,
      compress: false,
      redirect: 'manual',
      agent,
    });
    const buff = await fRes.buffer();

    return {
      status: fRes.status,
      headers: fRes.headers.raw(),
      body: buff,
    };
  }
}
