import http, { Server as HttpServer, IncomingMessage, ServerResponse, RequestListener } from 'http';
import https, { Server as HttpsServer } from 'https';
import fs from 'fs';
import onExit from 'async-exit-hook';
import RequestHandler from './request-handler';
import Summary from './summary';
import TapeStoreManager from './tape-store-manager';
import { parseUrl } from './utils/url';
import { Options } from './options';
import { Request } from './types/http';

type Server = HttpServer | HttpsServer;

export default class TalkbackServer {
  private options: Options;
  private server: Server;
  public tapeStoreManager: TapeStoreManager;
  // private closeHandler:

  constructor(options: Options) {
    this.options = options;
    this.tapeStoreManager = new TapeStoreManager(this.options);
    this.handleRequest = this.handleRequest.bind(this);
    this.server = this.createServer(this.handleRequest);
  }

  createServer(requestListener: RequestListener): HttpServer | HttpsServer {
    if (this.options.https) {
      const httpsOpts = {
        key: fs.readFileSync(this.options.https.keyPath),
        cert: fs.readFileSync(this.options.https.certPath),
      };

      return https.createServer(httpsOpts, requestListener);
    }

    return http.createServer(requestListener);
  }

  handleRequest(req: IncomingMessage, res: ServerResponse) {
    const reqBodyChunks: Buffer[] = [];

    req
      .on('data', (chunk) => {
        reqBodyChunks.push(chunk);
      })
      .on('end', async () => {
        try {
          const request = req as Request;

          request.body = Buffer.concat(reqBodyChunks);
          const requestHandler = new RequestHandler(this.tapeStoreManager, this.options);
          const fRes = await requestHandler.handle(request);

          res.writeHead(fRes.status, fRes.headers);
          res.end(fRes.body);
        } catch (error) {
          this.options.logger.error('Error handling request');
          this.options.logger.error(error);
          res.statusCode = 500;
          res.end();
        }
      });
  }

  start(callback: () => void) {
    this.options.logger.log(`Starting talkback on ${this.options.talkbackUrl}`);
    const url = parseUrl(this.options.talkbackUrl);
    const promise = new Promise((resolve) => {
      this.server.listen(url, () => {
        if (callback) callback();
        resolve(this.server);
      });
    });

    onExit(() => this.close());

    return promise;
  }

  hasTapeBeenUsed(tapeName: string) {
    return this.tapeStoreManager.hasTapeBeenUsed(tapeName);
  }

  resetTapeUsage() {
    this.tapeStoreManager.resetTapeUsage();
  }

  close(callback?: () => void) {
    this.server.close(callback);

    process.removeListener('exit', this.close);
    process.removeListener('SIGINT', this.close);
    process.removeListener('SIGTERM', this.close);

    if (this.options.summary) {
      const summary = new Summary(this.tapeStoreManager.getAllTapes(), this.options);

      summary.print();
    }
  }
}
