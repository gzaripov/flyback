# Flyback

Record, replay and mock HTTP requests.
Flyback is a javascript HTTP recorder written in typescript. Can be used as standalone server or http middleware.
It is created for use in your integration or e2e tests or running your application against mocked HTTP servers.

[![npm version](https://badge.fury.io/js/flyback.svg)](https://badge.fury.io/js/flyback)
[![CircleCI](https://circleci.com/gh/gzaripov/flyback.svg?style=svg)](https://circleci.com/gh/gzaripov/flyback)
[![codecov](https://codecov.io/gh/gzaripov/flyback/branch/master/graph/badge.svg)](https://codecov.io/gh/gzaripov/flyback)

## Installation

```
npm i flyback
yarn add flyback
```

## Usage

```javascript

const { createFlybackMiddleware, FlybackServer, RecordModes } =  require("flyback");

const  options  = {
	proxyUrl:  "https://api.service.com/v3/",
	recordMode:  RecordModes.NEW,
	silent:  true,
	summary:  false,
	path:  "./tapes",
	tapeExtension:  'json5'
};

const  server  =  new  FlybackServer(opts);

server.start();

// or

const  middleware  =  createFlybackMiddleware(options);

```

### flyback(opts)

Returns an unstarted flyback server instance.

**Options:**

| Name | Type | Description | Default |
|------|------|-------------|---------|
| *proxyUrl* | `String` | Where to proxy unknown requests |
| *flybackUrl* | `String` | Where to serve flyback server (ignored for middleware) | http://localhost:8080 |
| *tapesPath* | `String` | Path where to load and save tapes | undefined |
| *recordMode* | `RecordMode \| Function` | Set record mode. [More info](#recording-modes) | `RecordMode.NEW` |
| *fallbackMode* | `FallbackMode \| Function` | Fallback mode for unknown requests when recording is disabled. [More info](#recording-modes) | `FallbackMode.NOT_FOUND` |
| *tapeNameGenerator* | `Function` | [Customize](#file-name) how a tape file name is generated for new tapes. | `null` |
| *tapePathGenerator* | `Function` | [Customize](#file-name) how a tape file path (to directory) is generated for new tapes. | `null` |
| *tapeFileExtension* | `String` | Tape file extension | `.json` |
| *https* | `Object` | HTTPS cert options [options](#https-options) used to create https server in FlybackServer | null |
| *agent* | `https.Agent` | https.Agent for node-fetch to make requests to proxyUrl |
| *ignoreQueryParams* | `[String]` | Query params to ignore when matching tapes. Useful when having dynamic query params like timestamps| `[]` |
| *ignoreAllQueryParams* | `Boolean` | Ignore all query params when matching tapes. | `['content-length', 'host]` |
| *ignoreHeaders* | `[String]` | List of headers to ignore when matching tapes. Useful when having dynamic headers like cookies or correlation ids | `['content-length', 'host]` |
| *ignoreAllHeaders* | `[String]` | List of headers to ignore when matching tapes. Useful when having dynamic headers like cookies or correlation ids | `['content-length', 'host]` |
| *ignoreBody* | `Boolean` | Should the request body be ignored when matching tapes | `false` |
| *tapeMatcher* | `Function` | Customize how a request's body is matched against saved tapes. [More info](#custom-request-body-matcher) | `null` |
| *tapeDecorator* | `Function` | Decorate tapes when they are created. [More info](#custom-response-decorator) | `null` |
| *summary* | `Boolean` | Enable exit summary of new and unused tapes at exit. [More info](#exit-summary) | `true` |
| *verbose* | `Boolean` | Enable requests information printing | `false` |
| *debug* | `Boolean` | Enable debug information | `false` |

  

### HTTPS options

| Name        | Type     | Description           | Default |
|-------------|----------|-----------------------|---------|
| *keyPath*   | `String` | Path to the key file  | `null`  |
| *certPath*  | `String` | Path to the cert file | `null`  |

## Api

### FlybackServer(options)

#### start([callback])
Starts the HTTP server.

#### close([callback])
Stops the HTTP server.

### createFlybackMiddleware(options)

returns node [middleware](https://expressjs.com/en/guide/using-middleware.html)
 

## Tapes

Tapes can be freely edited to match new requests or return a different response than the original. They are loaded recursively from the `tapesPath` directory at startup if specified.  

`tapesPath` can be generated dynamically, you can take it from request header or cookie, it can be used in testing with puppeteer, you can add header with test path, and tapes will be loaded from directory near test files


### Format

All tapes have the following 2 properties:

 **Request**:  Used to match incoming requests against the tape.

```typescript
export  type  RequestJson  = {
	pathname:  string;
	query?:  QueryParamsObject;
	method:  string;
	headers:  HeadersJson;
	body?:  string  |  Object;
};
```

**Response**:  The HTTP response that will be returned in case the tape matches a request.

 ```typescript
export  type  ResponseJson  = {
	status:  number;
	headers:  HeadersJson;
	body?:  string  |  Object;
};
```

You can edit any part of the tape through tapeDecorator option.

Flyback doesn't watch tape files so if you will change them in runtime, changes wont be applied

  

### Tape naming

Tape name by default generated from path,  for `/api/v3/data` you will have `api.v3.data.json` tape name

Tapes can be renamed at will, for example to give some meaning to the scenario the tape represents.

If a custom `tapeNameGenerator` is provided, it will be called to produce an alternate file path under `path` that can be based on the tape contents. Note that the file extension `.json` will be appended automatically if need.


### Grouping

Tapes with the same paths in directory will be grouped in tape file in case tapes don't match and record mode is NEW or OVERWRITE, tape file consist of tapes, you can edit it as regular tape. 

 
### Request and Response body

If the content type of the request or response is considered _human readable_, the body will be saved in plain text or plain object. It works even in case your content is gzipped or brottlied, it will uncompress your tapes before serialization and compress it before returning matching tape

Otherwise, the body will be saved as a Base64 string, allowing to save binary content.


### Pretty Printing

If the request or response have a JSON *content-type*, their body will be pretty printed as an object in the tape for better readability.
Two tapes with json bodies will be compared using deep equal tool, so order of keys in object doesn't matter

## Recording Modes

Flyback proxying and recording behavior can be controlled through the `recordMode` option.
This option accepts either one of the possible recording modes to be used for all requests or a function that takes the request as a parameter and returns a valid recording mode.
There are 4 possible recording modes:
|Value| Description|
|-------|------------|
|`NEW`| If no tape matches the request, proxy it and save the response to a tape|
|`OVERWRITE`| Always proxy the request and save the response to a tape, overwriting any existing one|
|`DISABLED`| If a matching tape exists, return it. Otherwise, don't proxy the request and use `fallbackMode` for the response|
|`PROXY`| Always proxy request and don't save any tapes |

The `fallbackMode` option lets you choose what do you want flyback to do when recording is disabled and an unknown request arrives.

Same as with `recordMode`, this option accepts either one of the possible modes values to be used for all requests or a function that takes the request as a parameter and returns a mode.

There are 2 possible fallback modes:
 
|Value| Description|
|-----|------------|
|`NOT_FOUND`| Log an error and return a 404 response|
|`PROXY`| Proxy the request to `host` and return its response, but don't create a tape|
  

flyback exports constants for the different options values:

```javascript

const { RecordModes, FallbackModes } = require("flyback")

const  opts  = {
	record: RecordModes.OVERWRITE,
	fallbackMode: FallbackModes.PROXY
}

```

  

##  Tape matcher

By default, in order for a request to match against a saved tape, both request and tape need to have the exact same body.

There might be cases were this rule is too strict (for example, if your body contains time dependent bits) but enabling `ignoreBody` is too lax.

flyback lets you pass a custom matching function as the `tapeMatcher` option.


### Example:

```javascript

const tapeMatcher = (tape: TapeJson, request: RequestJson) => {
	return tape.request.pathname === request.pathname 
			&& tape.request.method === request.method
};

```
In this case we are matching tapes by their pathname and method

## Tape decorator

If you want to change tape content before serializing it or before sending to server you can use the `tapeDecorator` option.

This can be useful for example if your response needs to contain an ID that gets sent on the request, or if your response has a time dependent field.

The function will receive a copy of the matching tape and it has to return the modified tape. Note that since you're receiving a copy of the matching tape, modifications that you do to it won't persist between different requests.
  

### Example:

We're going to hit an `/auth` endpoint, and update just the `expiration` field of the JSON response that was saved in the tape to be a day from now.  

```typescript
const tapeDecorator = (tape: TapeJson) => {
	if (tape.request.headers.date) {
		tape.request.headers.data = new Date().toISOString();
	}
	
	return tape;
};
```

## Inspiration
  
[Talkback](https://github.com/ijpiantanida/talkback)

[Polly.js](https://github.com/Netflix/pollyjs/tree/master/packages/%40pollyjs/adapter-puppeteer)
  

# Licence

MIT
