import fetch, { Headers as FetchHeaders } from 'node-fetch';
import Tape from './tape';
import { Opts, Options } from './options';
import TapeStoreManager from './tape-store-manager';
import { Request, Response } from './types/http';

export default class RequestHandler {
  private tapeStoreManager: TapeStoreManager;
  private options: Options;

  constructor(tapeStoreManager: TapeStoreManager, options: Options) {
    this.tapeStoreManager = tapeStoreManager;
    this.options = options;
  }

  async handle(req: Request): Promise<Response> {
    const recordMode =
      typeof this.options.record !== 'function' ? this.options.record : this.options.record(req);

    Opts.validateRecord(recordMode);

    const newTape = new Tape(req, this.options);
    const tapeStore = this.tapeStoreManager.getTapeStore(newTape);
    const matchingTape = tapeStore.find(newTape);

    let resObj;

    let responseTape;

    if (recordMode !== 'OVERWRITE' && matchingTape) {
      responseTape = matchingTape;
    } else {
      if (matchingTape) {
        responseTape = matchingTape;
      } else {
        responseTape = newTape;
      }

      if (recordMode === 'NEW' || recordMode === 'OVERWRITE') {
        resObj = await this.makeRealRequest(req);
        responseTape.response = { ...resObj };
        tapeStore.save(responseTape);
      } else {
        resObj = await this.onNoRecord(req);
        responseTape.response = { ...resObj };
      }
    }

    resObj = responseTape.response;

    if (this.options.tapeDecorator) {
      const resTape = this.options.tapeDecorator(responseTape.clone());

      if (resTape.response && resTape.response.headers['content-length']) {
        resTape.response.headers['content-length'] = [resTape.response.body.length.toString()];
      }

      resObj = resTape.response;
    }

    if (!resObj) {
      // TODO remove this check
      throw new Error('Unable to make response');
    }

    return resObj;
  }

  async onNoRecord(req: Request): Promise<Response> {
    const fallbackMode =
      typeof this.options.fallbackMode !== 'function'
        ? this.options.fallbackMode
        : this.options.fallbackMode(req);

    Opts.validateFallbackMode(fallbackMode);

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
    const headers = ({ ...req.headers } as any) as FetchHeaders;

    // delete headers.host;

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
