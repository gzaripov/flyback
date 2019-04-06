import MediaType from "./utils/media-type"

const URL = require("url")
const querystring = require("querystring")
export default class TapeMatcher {
  constructor(tape, options) {
    this.tape = tape
    this.options = options
  }

  sameAs(otherTape) {
    const otherReq = otherTape.req
    const req = this.tape.req
    const sameURL = req.url === otherReq.url
    if (!sameURL) {
      if (!this.options.urlMatcher) {
        this.options.logger.debug(`Not same URL ${req.url} vs ${otherReq.url}`)
        return false
      }

      const urlMatches = this.options.urlMatcher(this.tape, otherReq)
      if(!urlMatches) {
        this.options.logger.debug(`Not same urlMatcher ${req.url} vs ${otherReq.url}`)
        return false
      }
    }

    const sameMethod = req.method === otherReq.method
    if (!sameMethod) {
      this.options.logger.debug(`Not same METHOD ${req.method} vs ${otherReq.method}`)
      return false
    }

    const currentHeadersLength = Object.keys(req.headers).length
    const otherHeadersLength = Object.keys(otherReq.headers).length
    const sameNumberOfHeaders = currentHeadersLength === otherHeadersLength
    if (!sameNumberOfHeaders) {
      this.options.logger.debug(`Not same #HEADERS ${JSON.stringify(req.headers)} vs ${JSON.stringify(otherReq.headers)}`)
      return false
    }

    let headersSame = true
    Object.keys(req.headers).forEach(k => {
      const entryHeader = req.headers[k]
      const header = otherReq.headers[k]

      headersSame = headersSame && entryHeader === header
    })
    if (!headersSame) {
      this.options.logger.debug(`Not same HEADERS values ${JSON.stringify(req.headers)} vs ${JSON.stringify(otherReq.headers)}`)
      return false
    }

    if (!this.options.ignoreBody) {
      const mediaType = new MediaType(req)

      let sameBody = false
      if(mediaType.isJSON() && req.body.length > 0 && otherReq.body.length > 0) {
        sameBody = JSON.stringify(JSON.parse(req.body.toString())) === JSON.stringify(JSON.parse(otherReq.body.toString()))
      } else {
        sameBody = req.body.equals(otherReq.body)
      }

      if (!sameBody) {
        if (!this.options.bodyMatcher) {
          this.options.logger.debug(`Not same BODY ${req.body} vs ${otherReq.body}`)
          return false
        }

        const bodyMatches = this.options.bodyMatcher(this.tape, otherReq)
        if(!bodyMatches) {
          this.options.logger.debug(`Not same bodyMatcher ${req.body} vs ${otherReq.body}`)
          return false
        }
      }
    }
    return true
  }

  matchQueryParams() {
    if (this.queryParamsToIgnore.length === 0) {
      return
    }

    const url = URL.parse(this.req.url, {parseQueryString: true})
    if (!url.search) {
      return
    }

    const query = {...url.query}
    this.queryParamsToIgnore.forEach(q => delete query[q])

    const newQuery = querystring.stringify(query)
    if (newQuery) {
      url.query = query
      url.search = "?" + newQuery
    } else {
      url.query = null
      url.search = null
    }
    this.req.url = URL.format(url)
  }
}
