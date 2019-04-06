const http = require("http")
const https = require("https")
const fs = require("fs");

import RequestHandler from "./request-handler"
import Summary from "./summary"
import TapeStoreManager from "./tape-store-manager"
import { parseUrl } from './utils/url';

export default class TalkbackServer {
  constructor(options) {
    this.options = options
    this.tapeStoreManager = new TapeStoreManager(this.options);
  }

  handleRequest(req, res) {
    let reqBody = []
    req.on("data", (chunk) => {
      reqBody.push(chunk)
    }).on("end", async () => {
      try {
        reqBody = Buffer.concat(reqBody)
        req.body = reqBody
        const requestHandler = new RequestHandler(this.tapeStoreManager, this.options)
        const fRes = await requestHandler.handle(req)

        res.writeHead(fRes.status, fRes.headers)
        res.end(fRes.body)
      } catch (ex) {
        console.error("Error handling request", ex)
        res.statusCode = 500
        res.end()
      }
    })
  }

  start(callback) {
    const app = this.handleRequest.bind(this);

    const serverFactory = this.options.https.enabled ? () => {
      const httpsOpts = {
        key: fs.readFileSync(this.options.https.keyPath),
        cert: fs.readFileSync(this.options.https.certPath)
      };
      return https.createServer(httpsOpts, app);
    }  : () => http.createServer(app);

    this.server = serverFactory();
    console.log(`Starting talkback on ${this.options.talkbackUrl}`)
    const url = parseUrl(this.options.talkbackUrl);
    const promise = new Promise((resolve) => {
      this.server.listen(url, () => {
        callback && callback();
        resolve(this.server);
      })
    })
    this.closeSignalHandler = this.close.bind(this)
    process.on("exit", this.closeSignalHandler)
    process.on("SIGINT", this.closeSignalHandler)
    process.on("SIGTERM", this.closeSignalHandler)

    return promise;
  }

  hasTapeBeenUsed(tapeName) {
    return this.tapeStoreManager.hasTapeBeenUsed(tapeName);
  }

  resetTapeUsage() {
    this.tapeStoreManager.resetTapeUsage();
  }

  close(callback) {
    if (this.closed) {
      return
    }
    this.closed = true
    this.server.close(callback)

    process.removeListener("exit", this.closeSignalHandler)
    process.removeListener("SIGINT", this.closeSignalHandler)
    process.removeListener("SIGTERM", this.closeSignalHandler)

    if (this.options.summary) {
      const summary = new Summary(this.tapeStoreManager.getAllTapes(), this.options)
      summary.print()
    }
  }
}
