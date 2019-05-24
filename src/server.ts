import http, { Server as HttpServer } from 'http';
import https, { Server as HttpsServer } from 'https';
import fs from 'fs';
import onExit from 'async-exit-hook';
import Summary from './summary';
import TapeStoreManager from './tape-store-manager';
import { parseUrl } from './utils/url';
import { Context, createContext, Options } from './options';
import { createTalkbackMiddleware } from './middleware';

type Server = HttpServer | HttpsServer;

export default class TalkbackServer {
  private options: Context;
  private server: Server;
  public tapeStoreManager: TapeStoreManager;

  constructor(options: Options) {
    this.options = createContext(options);
    this.tapeStoreManager = new TapeStoreManager(this.options);
    this.server = this.createServer(createTalkbackMiddleware(this.options, this.tapeStoreManager));
  }

  createServer(requestListener: http.RequestListener): HttpServer | HttpsServer {
    if (this.options.https) {
      const httpsOpts = {
        key: fs.readFileSync(this.options.https.keyPath),
        cert: fs.readFileSync(this.options.https.certPath),
      };

      return https.createServer(httpsOpts, requestListener);
    }

    return http.createServer(requestListener);
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

    /* istanbul ignore next line */
    onExit(() => this.close());

    return promise;
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
