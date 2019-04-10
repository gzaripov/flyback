import fs from 'fs';
import path from 'path';
import fetch, { RequestInit } from 'node-fetch';
import del from 'del';
import talkback from '../src/index';
import testServer from './support/test-server';
import { parseUrl } from '../src/utils/url';
import Logger from '../src/logger';
import Tape from '../src/tape';

// malfromed-tape.json parse error message is expected,
// so dont pollute test logs
Logger.prototype.error = (error: Object) => {
  if (!error.toString().match(/(malformed-tape.json)/)) {
    console.error(error);
  }
};

let talkbackServer;
let proxiedServer;

const tapesPath = `${__dirname}/tapes`;

const proxyUrl = `http://localhost:8898`;
const talkbackUrl = `http://localhost:8899`;

function normalizeUrl(url) {
  return url.startsWith('/') ? url.substring(1) : url;
}

function talkbackFetch(relativeUrl: string, init?: RequestInit) {
  return fetch(`${talkbackUrl}/${normalizeUrl(relativeUrl)}`, init);
}

function takeTapeNameFromUrl(url) {
  return normalizeUrl(url)
    .split('/')
    .join('.');
}

const tapeNameGenerator = (tape: Tape) => takeTapeNameFromUrl(tape.request.url);

function readJSONFromFile(tapesPath: string, url: string) {
  const fileName = takeTapeNameFromUrl(url);

  return JSON.parse(fs.readFileSync(`${tapesPath}/${fileName}.json`).toString());
}

const startTalkback = async (opts?, callback?) => {
  const talkbackServer = talkback({
    proxyUrl,
    talkbackUrl,
    tapesPath,
    record: 'NEW',
    silent: true,
    tapeNameGenerator,
    bodyMatcher: (tape) => {
      return tape.meta.tag === 'echo';
    },
    tapeDecorator: (tape: Tape) => {
      if (tape.meta.tag === 'echo') {
        tape.response.body = tape.request.body;
      }
      const location = tape.response.headers['location'];

      if (location && location[0]) {
        tape.response.headers['location'] = [location[0].replace(proxyUrl, talkbackUrl)];
      }

      return tape;
    },
    ...opts,
  });

  await talkbackServer.start(callback);

  return talkbackServer;
};

const cleanupTapes = () => {
  // Delete all unnamed tapes
  const files = fs.readdirSync(tapesPath);

  for (let i = 0, len = files.length; i < len; i++) {
    const match = files[i].match(/unnamed-/);

    if (match !== null) {
      fs.unlinkSync(path.join(tapesPath, files[i]));
    }
  }
  const newTapesPath = path.join(tapesPath, 'new-tapes');

  del.sync(newTapesPath);
};

describe('talkback', () => {
  beforeEach(() => cleanupTapes());

  beforeAll(async () => {
    proxiedServer = testServer();
    await proxiedServer.listen(parseUrl(proxyUrl));
  });

  afterAll(() => {
    if (proxiedServer) {
      proxiedServer.close();
      proxiedServer = null;
    }
  });

  afterEach(() => {
    if (talkbackServer) {
      talkbackServer.close();
      talkbackServer = null;
    }
  });

  describe.only('## record mode NEW', () => {
    it.only('proxies and creates a new tape when the POST request is unknown with human readable req and res', async () => {
      talkbackServer = await startTalkback();

      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const url = '/test/1';
      const res = await talkbackFetch(url, {
        compress: false,
        method: 'POST',
        headers,
        body: reqBody,
      });

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: { foo: 'bar' } };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.meta.requestHumanReadable).toEqual(true);
      expect(tape.meta.responseHumanReadable).toEqual(true);
      expect(tape.request.url).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the GET request is unknown', async () => {
      talkbackServer = await startTalkback();
      const url = '/test/1';
      const res = await talkbackFetch(url, { compress: false, method: 'GET' });

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: null };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.meta.requestHumanReadable).toEqual(undefined);
      expect(tape.meta.responseHumanReadable).toEqual(true);
      expect(tape.request.url).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the POST request is unknown with human readable req and res', async () => {
      talkbackServer = await startTalkback();

      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const url = `test/1`;
      const res = await talkbackFetch(url, {
        compress: false,
        method: 'POST',
        headers,
        body: reqBody,
      });

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: { foo: 'bar' } };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.meta.requestHumanReadable).toEqual(true);
      expect(tape.meta.responseHumanReadable).toEqual(true);
      expect(tape.request.url).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the HEAD request is unknown', async () => {
      talkbackServer = await startTalkback();

      const headers = { 'content-type': 'application/json' };
      const url = 'test/head';
      const res = await talkbackFetch(url, { method: 'HEAD', headers });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.meta.requestHumanReadable).toEqual(undefined);
      expect(tape.meta.responseHumanReadable).toEqual(undefined);
      expect(tape.request.url).toEqual('/test/head');
      expect(tape.request.body).toEqual('');
      expect(tape.response.body).toEqual('');
    });

    it('proxies and creates a new tape with a custom tape name generator', async () => {
      talkbackServer = await startTalkback();

      const url = `/test/1`;
      const res = await talkbackFetch(url, { compress: false, method: 'GET' });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.url).toEqual(url);
    });

    it('decorates proxied responses', async () => {
      talkbackServer = await startTalkback();

      const res = await talkbackFetch('test/redirect/1', {
        compress: false,
        method: 'GET',
        redirect: 'manual',
      });

      expect(res.status).toEqual(302);

      const location = res.headers.get('location');

      expect(location).toEqual(`${talkbackUrl}/test/1`);
    });

    it('handles when the proxied server returns a 500', async () => {
      talkbackServer = await startTalkback();

      const url = 'test/3';
      const res = await talkbackFetch(url);

      expect(res.status).toEqual(500);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.url).toEqual('/test/3');
      expect(tape.response.status).toEqual(500);
    });

    it('loads existing tapes and uses them if they match', async () => {
      talkbackServer = await startTalkback({ record: 'DISABLED' });

      const res = await talkbackFetch('test/3', { compress: false });

      expect(res.status).toEqual(200);

      const body = await res.json();

      expect(body).toEqual({ ok: true });
    });

    it('matches and returns pretty printed tapes', async () => {
      talkbackServer = await startTalkback({ record: 'DISABLED' });

      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ param1: 3, param2: { subParam: 1 } });

      const res = await talkbackFetch('test/pretty', {
        compress: false,
        method: 'POST',
        headers,
        body,
      });

      expect(res.status).toEqual(200);

      const resClone = res.clone();

      const resBody = await res.json();

      expect(resBody).toEqual({ ok: true, foo: { bar: 3 } });

      const resBodyAsText = await resClone.text();

      expect(resBodyAsText).toEqual('{\n  "ok": true,\n  "foo": {\n    "bar": 3\n  }\n}');
    });

    it('calls provided callback', async () => {
      const counter = { count: 0 };

      talkbackServer = await startTalkback({ record: 'DISABLED' }, () => {
        counter.count += 1;
      });
      expect(counter.count).toEqual(1);
    });

    it("doesn't match pretty printed tapes with different body", async () => {
      const headers = { 'content-type': 'application/json' };

      const makeRequest = async (body) => {
        const res = await talkbackFetch('test/pretty', {
          compress: false,
          method: 'POST',
          headers,
          body,
        });

        expect(res.status).toEqual(404);
      };

      talkbackServer = await startTalkback({ record: 'DISABLED' });

      // Different nested object
      let body = JSON.stringify({ param1: 3, param2: { subParam: 2 } });

      await makeRequest(body);

      // Different key order
      body = JSON.stringify({ param2: { subParam: 1 }, param1: 3 });
      await makeRequest(body);

      // Extra key
      body = JSON.stringify({ param1: 3, param2: { subParam: 1 }, param3: false });
      await makeRequest(body);
    });

    it('decorates the response of an existing tape', async () => {
      talkbackServer = await startTalkback({ record: 'DISABLED' });

      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ text: 'my-test' });

      const res = await talkbackFetch(`test/echo`, {
        compress: false,
        method: 'POST',
        headers,
        body,
      });

      expect(res.status).toEqual(200);

      const resBody = await res.json();

      expect(resBody).toEqual({ text: 'my-test' });
    });
  });

  describe('## record mode OVERWRITE', () => {
    it('overwrites an existing tape', async () => {
      talkbackServer = await startTalkback({
        record: 'OVERWRITE',
        ignoreHeaders: ['x-talkback-ping'],
        silent: false,
        debug: true,
      });

      const url = 'test/1';
      let headers = { 'x-talkback-ping': 'test1' };

      let res = await talkbackFetch(url, { compress: false, headers });

      expect(res.status).toEqual(200);
      let resBody = await res.json();
      let expectedBody = { ok: true, body: 'test1' };

      expect(resBody).toEqual(expectedBody);

      let tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.url).toEqual('test/1');
      expect(tape.response.body).toEqual(expectedBody);

      headers = { 'x-talkback-ping': 'test2' };

      res = await fetch(url, { compress: false, headers });
      expect(res.status).toEqual(200);
      resBody = await res.json();
      expectedBody = { ok: true, body: 'test2' };
      expect(resBody).toEqual(expectedBody);

      tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.url).toEqual('test/1');
      expect(tape.response.body).toEqual(expectedBody);
    });
  });

  describe('## record mode DISABLED', () => {
    it('returns a 404 on unkwown request with fallbackMode NOT_FOUND (default)', async () => {
      talkbackServer = await startTalkback({ record: 'DISABLED' });

      const res = await talkbackFetch('test/1', { compress: false });

      expect(res.status).toEqual(404);
    });

    it('proxies request to host on unkwown request with fallbackMode PROXY', async () => {
      talkbackServer = await startTalkback({
        record: 'DISABLED',
        fallbackMode: 'PROXY',
      });

      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const res = await talkbackFetch('test/1', {
        compress: false,
        method: 'POST',
        headers,
        body: reqBody,
      });

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: { foo: 'bar' } };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      expect(fs.existsSync(`${tapesPath}/unnamed-3.json`)).toEqual(false);
    });
  });

  describe('error handling', () => {
    it('returns a 500 if anything goes wrong', async () => {
      talkbackServer = await startTalkback({ record: 'DISABLED' });

      jest.spyOn(talkbackServer.tapeStoreManager, 'find').mockImplementation(() => {
        throw new Error('Test error');
      });

      const res = await talkbackFetch('test/1', { compress: false });

      expect(res.status).toEqual(500);
    });
  });

  describe('summary printing', () => {
    it('prints the summary when enabled', async () => {
      talkbackServer = await startTalkback({ summary: true });
      talkbackServer.close();

      expect(console.log).toBeCalledWith(expect.stringContaining('SUMMARY'));
    });

    it("doesn't print the summary when disabled", async () => {
      talkbackServer = await startTalkback({ summary: false });
      talkbackServer.close();

      expect(console.log).toBeCalledWith(expect.not.stringContaining('SUMMARY'));
    });
  });

  describe('tape usage information', () => {
    it('should indicate that a tape has been used after usage', async () => {
      talkbackServer = await startTalkback({ record: 'DISABLED' });

      expect(talkbackServer.hasTapeBeenUsed('saved-request.json')).toEqual(false);

      const res = await talkbackFetch('test/3', { compress: false });

      expect(res.status).toEqual(200);

      expect(talkbackServer.hasTapeBeenUsed('saved-request.json')).toEqual(true);

      talkbackServer.resetTapeUsage();

      expect(talkbackServer.hasTapeBeenUsed('saved-request.json')).toEqual(false);

      const body = await res.json();

      expect(body).toEqual({ ok: true });
    });
  });

  describe('https', () => {
    it('should be able to run a https server', async () => {
      const talkbackUrl = 'https://localhost:8899';
      const options = {
        talkbackUrl,
        record: 'DISABLED',
        https: {
          enabled: true,
          keyPath: './example/httpsCert/localhost.key',
          certPath: './example/httpsCert/localhost.crt',
        },
      };

      talkbackServer = await startTalkback(options);

      // Disable self-signed certificate check
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

      const res = await talkbackFetch('test/3', { compress: false });

      expect(res.status).toEqual(200);
    });
  });
});
