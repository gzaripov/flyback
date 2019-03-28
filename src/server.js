const http = require("http")
const https = require("https")
const fs = require("fs");

import RequestHandler from "./request-handler"
import Summary from "./summary"
import TapeStore from "./tape-store"
import { parseUrl } from './utils/url';

export default class TalkbackServer {
  constructor(options) {
    this.options = options
    this.tapeStore = new TapeStore(this.options)
  }

  handleRequest(req, res) {
    let reqBody = []
    req.on("data", (chunk) => {
      reqBody.push(chunk)
    }).on("end", async () => {
      try {
        reqBody = Buffer.concat(reqBody)
        req.body = reqBody
        const requestHandler = new RequestHandler(this.tapeStore, this.options)
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
    this.tapeStore.load()
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
        console.log(`Server started on ${JSON.stringify(url)}`)
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
    return this.tapeStore.hasTapeBeenUsed(tapeName);
  }

  resetTapeUsage() {
    this.tapeStore.resetTapeUsage();
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
      const summary = new Summary(this.tapeStore.tapes, this.options)
      summary.print()
    }
  }
}
