import MediaType from "./utils/media-type"
import TapeRenderer from "./tape-renderer"

export default class Tape {
  constructor(req, options) {
    this.req = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body
    }
    this.options = options
    this.normalizeBody()
    this.meta = {
      createdAt: new Date(),
      endpoint: this.options.proxyUrl
    }
  }

  static fromStore(...args) {
    return TapeRenderer.fromStore(...args)
  }

  normalizeBody() {
    const mediaType = new MediaType(this.req)
    if(mediaType.isJSON() && this.req.body.length > 0) {
      this.req.body = Buffer.from(JSON.stringify(JSON.parse(this.req.body), null, 2))
    }
  }

  clone() {
    const raw = new TapeRenderer(this).render()
    return Tape.fromStore(raw, this.options)
  }
}
