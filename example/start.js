var talkback = require("../dist/index")

var host = "https://api.github.com"

function bodyMatcher(tape, req) {
  if (tape.meta.tag === "fake-post") {
    var tapeBody = JSON.parse(tape.req.body.toString())
    var reqBody = JSON.parse(req.body.toString())

    return tapeBody.username === reqBody.username
  }
  return false
}

function responseDecorator(tape, req) {
  if (tape.meta.tag === "auth") {
    var tapeBody = JSON.parse(tape.res.body.toString())
    var expiration = new Date()
    expiration.setDate(expiration.getDate() + 1)
    var expirationEpoch = Math.floor(expiration.getTime() / 1000)
    tapeBody.expiration = expirationEpoch

    var newBody = JSON.stringify(tapeBody)
    tape.res.body = Buffer.from(newBody)
  }
  return tape
}

var server = talkback({
  host: host,
  path: __dirname + "/tapes",
  record: true,
  debug: false,
  ignoreQueryParams: ["t"],
  bodyMatcher: bodyMatcher,
  responseDecorator: responseDecorator
})

server.start()