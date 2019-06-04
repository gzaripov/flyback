import http, { Server as HttpServer } from 'http';
import https, { Server as HttpsServer } from 'https';
import fs from 'fs';
import onExit from 'async-exit-hook';
import TapeStoreManager from './tape-store-manager';
import { urlToListenOptions } from './utils/url';
import { Context, createContext, Options } from './context';
import { createFlybackMiddleware } from './middleware';

type Server = HttpServer | HttpsServer;

export default class FlybackServer {
  private context: Context;
  private server: Server;
  private tapeStoreManager: TapeStoreManager;

  constructor(options: Options, tapeStoreManager?: TapeStoreManager) {
    this.context = createContext(options);
    this.tapeStoreManager = tapeStoreManager || new TapeStoreManager(this.context);
    this.server = this.createServer(createFlybackMiddleware(this.context, this.tapeStoreManager));
  }

  private createServer(requestListener: http.RequestListener): HttpServer | HttpsServer {
    if (this.context.https) {
      const httpsOpts = {
        key: fs.readFileSync(this.context.https.keyPath),
        cert: fs.readFileSync(this.context.https.certPath),
      };

      return https.createServer(httpsOpts, requestListener);
    }

    return http.createServer(requestListener);
  }

  start(callback: () => void) {
    this.context.logger.log(`Starting flyback on ${this.context.flybackUrl}`);
    const url = urlToListenOptions(this.context.flybackUrl);
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

    if (this.context.summary) {
      this.context.tapeAnalyzer.printStatistics();
    }
  }
}
