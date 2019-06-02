import fs from 'fs';
import path from 'path';
import https from 'https';
import fetch, { RequestInit } from 'node-fetch';
import del from 'del';
import testServer from './test-server';
import TalkbackServer from '../../src/server';
import { urlToListenOptions } from '../../src/utils/url';
import Logger from '../../src/logger';
import { TapeJson } from '../../src/tape';
import { Context, Options } from '../../src/context';
import { RequestJson } from '../../src/http/request';

let talkbackServer: TalkbackServer;
let proxiedServer;

jest.setTimeout(1000000);

const tapesPath = `${__dirname}/tapes`;

const proxyUrl = `http://localhost:8898`;
const talkbackUrl = `http://localhost:8899`;

function normalizePath(url) {
  return url.startsWith('/') ? url.substring(1) : url;
}

function talkbackFetch(relativeUrl: string, init?: RequestInit, origin = talkbackUrl) {
  return fetch(`${origin}/${normalizePath(relativeUrl)}`, init);
}

function takeTapeNameFromPath(path) {
  return normalizePath(path)
    .split('/')
    .join('.');
}

const tapeNameGenerator = (request: RequestJson) => takeTapeNameFromPath(request.path);

function readJSONFromFile(tapesPath: string, url: string): TapeJson {
  const fileName = takeTapeNameFromPath(url);

  return JSON.parse(fs.readFileSync(`${tapesPath}/${fileName}.json`).toString());
}

const startTalkback = async (opts?: Partial<Options>, callback?) => {
  const talkbackServer = new TalkbackServer({
    proxyUrl,
    talkbackUrl,
    tapesPath,
    recordMode: 'NEW',
    silent: true,
    summary: false,
    tapeNameGenerator,
    tapeDecorator: (tape: TapeJson) => {
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
    const match = files[i].match(/unnamed-/) || files[i].match(/test./);

    if (match !== null) {
      fs.unlinkSync(path.join(tapesPath, files[i]));
    }
  }
  const newTapesPath = path.join(tapesPath, 'new-tapes');

  del.sync(newTapesPath);
};

describe('talkback', () => {
  beforeAll(async () => {
    proxiedServer = testServer();
    await proxiedServer.listen(urlToListenOptions(proxyUrl));
  });

  beforeEach(() => cleanupTapes());

  afterEach(() => {
    if (talkbackServer) {
      talkbackServer.close();
      talkbackServer = null;
    }
  });

  afterAll(() => {
    // cleanupTapes();

    if (proxiedServer) {
      proxiedServer.close();
      proxiedServer = null;
    }
  });

  describe('record mode NEW', () => {
    it('proxies and creates a new tape when the POST request is unknown with human readable req and res', async () => {
      talkbackServer = await startTalkback();

      const reqBody = { foo: 'bar' };
      const headers = { 'content-type': 'application/json' };
      const url = '/test/1';
      const response = await talkbackFetch(url, {
        compress: false,
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
      });

      expect(response.status).toEqual(200);

      const expectedResBody = { ok: true, body: { foo: 'bar' } };
      const body = await response.json();
      const tape = readJSONFromFile(tapesPath, url);

      expect(body).toEqual(expectedResBody);
      expect(tape.request.path).toEqual('/test/1');
      expect(tape.request.body).toEqual(reqBody);
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

      expect(tape.request.path).toEqual('/test/1');
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

      expect(tape.request.path).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the HEAD request is unknown', async () => {
      talkbackServer = await startTalkback();

      const headers = { 'content-type': 'application/json' };
      const url = 'test/head';
      const res = await talkbackFetch(url, { method: 'HEAD', headers });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual('/test/head');
      expect(tape.request.body).toEqual('');
      expect(tape.response.body).toEqual('');
    });

    it('proxies and creates a new tape with a custom tape name generator', async () => {
      talkbackServer = await startTalkback();

      const url = `/test/1`;
      const res = await talkbackFetch(url, { compress: false, method: 'GET' });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual(url);
    });

    it('decorates proxied responses', async () => {
      talkbackServer = await startTalkback();

      const res = await talkbackFetch('/test/redirect/1', {
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

      const path = 'test/3/500';
      const res = await talkbackFetch(path);

      expect(res.status).toEqual(500);

      const tape = readJSONFromFile(tapesPath, path);

      expect(tape.request.path).toEqual('/test/3/500');
      expect(tape.response.status).toEqual(500);
    });

    it('loads existing tapes and uses them if they match', async () => {
      talkbackServer = await startTalkback({ recordMode: 'DISABLED' });

      const res = await talkbackFetch('/test/3', { compress: false });

      expect(res.status).toEqual(200);

      const body = await res.json();

      expect(body).toEqual({ ok: true });
    });

    it('matches and returns pretty printed tapes', async () => {
      talkbackServer = await startTalkback({
        recordMode: 'DISABLED',
        ignoreAllHeaders: true,
      });

      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ param1: 3, param2: { subParam: 1 } });

      const res = await talkbackFetch('/test/pretty', {
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

      expect(JSON.parse(resBodyAsText)).toEqual({ ok: true, foo: { bar: 3 } });
    });

    it('calls provided callback', async () => {
      const counter = { count: 0 };

      talkbackServer = await startTalkback({ recordMode: 'DISABLED' }, () => {
        counter.count += 1;
      });
      expect(counter.count).toEqual(1);
    });

    it("doesn't match pretty printed tapes with different body", async () => {
      const headers = { 'content-type': 'application/json' };

      const makeRequest = async (body) => {
        const res = await talkbackFetch('/test/pretty', {
          compress: false,
          method: 'POST',
          headers,
          body,
        });

        expect(res.status).toEqual(404);
      };

      talkbackServer = await startTalkback({ recordMode: 'DISABLED' });

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
      const tapeDecorator = (tapeJson: TapeJson) => {
        if (tapeJson.response.headers['content-type'] === 'application/json') {
          const body = tapeJson.response.body;
          const json = typeof body === 'string' ? JSON.parse(body) : body;

          tapeJson.response.body = { text: `${json.text}__decorated` };
        }

        return tapeJson;
      };

      talkbackServer = await startTalkback({ recordMode: 'DISABLED', tapeDecorator });

      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ text: 'request-test-text' });

      const res = await talkbackFetch('/test/echo', {
        compress: false,
        method: 'POST',
        headers,
        body,
      });

      expect(res.status).toEqual(200);

      const resBody = await res.json();

      expect(resBody).toEqual({ text: 'response-test-text__decorated' });
    });
  });

  describe('record mode OVERWRITE', () => {
    it('overwrites an existing tape', async () => {
      talkbackServer = await startTalkback({
        recordMode: 'OVERWRITE',
        ignoreHeaders: ['x-talkback-ping'],
      });

      const url = 'test/1';
      let headers = { 'x-talkback-ping': 'test1' };

      let res = await talkbackFetch(url, { compress: false, headers });

      expect(res.status).toEqual(200);
      let resBody = await res.json();
      let expectedBody = { ok: true, body: 'test1' };

      expect(resBody).toEqual(expectedBody);

      let tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedBody);

      headers = { 'x-talkback-ping': 'test2' };

      res = await talkbackFetch(url, { compress: false, headers });
      expect(res.status).toEqual(200);
      resBody = await res.json();
      expectedBody = { ok: true, body: 'test2' };
      expect(resBody).toEqual(expectedBody);

      tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedBody);
    });
  });

  describe('record mode DISABLED', () => {
    it('returns a 404 on unkwown request with fallbackMode NOT_FOUND (default)', async () => {
      talkbackServer = await startTalkback({ recordMode: 'DISABLED' });

      const res = await talkbackFetch('/test/1', { compress: false });

      expect(res.status).toEqual(404);
    });

    it('proxies request to host on unkwown request with fallbackMode PROXY', async () => {
      talkbackServer = await startTalkback({
        recordMode: 'DISABLED',
        fallbackMode: 'PROXY',
      });

      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const res = await talkbackFetch('/test/1', {
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
      const logger = new Logger({ silent: true } as Context);

      const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

      talkbackServer = await startTalkback({ recordMode: 'DISABLED', logger });

      const error = new Error('Test error');

      jest.spyOn(talkbackServer.tapeStoreManager, 'getTapeStore').mockImplementation(() => {
        throw error;
      });

      const res = await talkbackFetch('/test/1', { compress: false });

      expect(loggerSpy).toHaveBeenCalledWith(error);
      expect(res.status).toEqual(500);
    });
  });

  describe('summary printing', () => {
    it('prints the summary when enabled', async () => {
      const logger = new Logger({ silent: true } as Context);
      const spy = jest.spyOn(console, 'log').mockImplementation(() => 0);

      talkbackServer = await startTalkback({ summary: true, logger });
      talkbackServer.close();

      expect(spy).toBeCalledWith(expect.stringContaining('SUMMARY'));
    });

    it("doesn't print the summary when disabled", async () => {
      const logger = new Logger({ silent: true } as Context);
      const spy = jest.spyOn(logger, 'log').mockImplementation(() => 0);

      talkbackServer = await startTalkback({ summary: false, logger });
      talkbackServer.close();

      expect(spy).toBeCalledWith(expect.not.stringContaining('SUMMARY'));
    });
  });

  describe('tape usage information', () => {
    // TODO
    xit('should indicate that a tape has been used after usage', async () => {
      talkbackServer = await startTalkback({
        recordMode: 'DISABLED',
        silent: true,
        summary: true,
      });

      // expect(talkbackServer.hasTapeBeenUsed('saved-request.json')).toEqual(false);

      const res = await talkbackFetch('/test/3', { compress: false });

      expect(res.status).toEqual(200);

      // expect(talkbackServer.hasTapeBeenUsed('saved-request.json')).toEqual(true);

      // talkbackServer.resetTapeUsage();

      // expect(talkbackServer.hasTapeBeenUsed('saved-request.json')).toEqual(false);

      const body = await res.json();

      expect(body).toEqual({ ok: true });
    });
  });

  describe('https', () => {
    it('should be able to run a https server', async () => {
      const talkbackUrl = 'https://localhost:8886';

      talkbackServer = await startTalkback({
        talkbackUrl,
        recordMode: 'DISABLED',
        https: {
          keyPath: './example/httpsCert/localhost.key',
          certPath: './example/httpsCert/localhost.crt',
        },
      });

      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const res = await talkbackFetch('/test/3', { agent, compress: false }, talkbackUrl);

      expect(res.status).toEqual(200);
    });
  });
});
