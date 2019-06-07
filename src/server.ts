import http, { Server as HttpServer } from 'http';
import https, { Server as HttpsServer } from 'https';
import fs from 'fs';
import onExit from 'async-exit-hook';
import { urlToListenOptions } from './utils/url';
import { Context, createContext, Options } from './context';
import { createFlybackMiddleware } from './middleware';

type Server = HttpServer | HttpsServer;

export default class FlybackServer {
  private context: Context;
  private server: Server;

  constructor(options: Options) {
    this.context = createContext(options);
    this.server = this.createServer(createFlybackMiddleware(options));
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

  start(callback?: (error?: Error) => void) {
    this.context.logger.log(`Starting flyback on ${this.context.flybackUrl}`);
    const url = urlToListenOptions(this.context.flybackUrl);
    const promise = new Promise((resolve) => {
      this.server.listen(url, (error?: Error) => {
        if (callback) callback(error);
        resolve(this.server);
      });
    });

    /* istanbul ignore next line */
    onExit(() => this.close());

    return promise;
  }

  close(callback?: (error?: Error) => void): Promise<void> {
    process.removeListener('exit', this.close);
    process.removeListener('SIGINT', this.close);
    process.removeListener('SIGTERM', this.close);

    if (this.context.summary) {
      this.context.tapeAnalyzer.printStatistics();
    }

    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (callback) {
          callback(error);
        }

        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }
}
