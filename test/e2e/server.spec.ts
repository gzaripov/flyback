import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import iltorb from 'iltorb';
import https from 'https';
import fetch, { RequestInit } from 'node-fetch';
import del from 'del';
import FlybackServer from '../../src/server';
import { urlToListenOptions } from '../../src/utils/url';
import Logger from '../../src/logger';
import { TapeJson } from '../../src/tape';
import { Context, Options } from '../../src/context';
import { RequestJson } from '../../src/http/request';
import TapeStoreManager from '../../src/tape-store-manager';
import TestServer from './test-server';

let flybackServer: FlybackServer;
let apiServer: TestServer;

jest.setTimeout(1000000);

const tapesPath = `${__dirname}/tapes`;

const proxyUrl = `http://localhost:8898`;
const flybackUrl = `http://localhost:8899`;

function normalizePath(url) {
  return url.startsWith('/') ? url.substring(1) : url;
}

function flybackFetch(relativeUrl: string, init?: RequestInit, origin = flybackUrl) {
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

const startFlyback = async (
  opts?: Partial<Options>,
  {
    callback,
    tapeStoreManager,
  }: { callback?: VoidFunction; tapeStoreManager?: TapeStoreManager } = {},
) => {
  const flybackServer = new FlybackServer(
    {
      proxyUrl,
      flybackUrl,
      tapesPath,
      recordMode: 'NEW',
      summary: false,
      tapeNameGenerator,
      ...opts,
    },
    tapeStoreManager,
  );

  await flybackServer.start(callback);

  return flybackServer;
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

describe('flyback', () => {
  beforeAll(async () => {
    apiServer = new TestServer();
    await apiServer.listen(urlToListenOptions(proxyUrl));
  });

  beforeEach(() => cleanupTapes());

  afterEach(() => {
    if (flybackServer) {
      flybackServer.close();
      flybackServer = null;
    }
  });

  afterAll(() => {
    // cleanupTapes();

    if (apiServer) {
      apiServer.close();
      apiServer = null;
    }
  });

  describe('record mode NEW', () => {
    it('proxies and creates a new tape when the POST request is unknown with human readable req and res', async () => {
      flybackServer = await startFlyback();

      const reqBody = { foo: 'bar' };
      const headers = { 'content-type': 'application/json' };
      const url = '/test/1';
      const response = await flybackFetch(url, {
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
      flybackServer = await startFlyback();
      const url = '/test/1';
      const res = await flybackFetch(url, { compress: false, method: 'GET' });

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: null };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the POST request is unknown with human readable req and res', async () => {
      flybackServer = await startFlyback();

      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const url = `test/1`;
      const res = await flybackFetch(url, {
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
      flybackServer = await startFlyback();

      const headers = { 'content-type': 'application/json' };
      const url = 'test/head';
      const res = await flybackFetch(url, { method: 'HEAD', headers });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual('/test/head');
      expect(tape.request.body).toEqual('');
      expect(tape.response.body).toEqual('');
    });

    it('proxies and creates a new tape with a custom tape name generator', async () => {
      flybackServer = await startFlyback();

      const url = `/test/1`;
      const res = await flybackFetch(url, { compress: false, method: 'GET' });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual(url);
    });

    it('decorates proxied responses', async () => {
      flybackServer = await startFlyback({
        tapeDecorator: (tape: TapeJson) => {
          const location = tape.response.headers['location'];

          if (typeof location === 'string') {
            tape.response.headers['location'] = [location.replace(proxyUrl, flybackUrl)];
          }

          return tape;
        },
      });

      const response = await flybackFetch('/test/redirect/1', {
        method: 'GET',
        redirect: 'manual',
      });

      expect(response.status).toEqual(302);

      const location = response.headers.get('location');

      expect(location).toEqual(`${flybackUrl}/test/1`);
    });

    it('handles when the proxied server returns a 500', async () => {
      flybackServer = await startFlyback();

      const path = 'test/3/500';
      const res = await flybackFetch(path);

      expect(res.status).toEqual(500);

      const tape = readJSONFromFile(tapesPath, path);

      expect(tape.request.path).toEqual('/test/3/500');
      expect(tape.response.status).toEqual(500);
    });

    it('loads existing tapes and uses them if they match', async () => {
      flybackServer = await startFlyback({ recordMode: 'DISABLED' });

      const res = await flybackFetch('/test/3', { compress: false });

      expect(res.status).toEqual(200);

      const body = await res.json();

      expect(body).toEqual({ ok: true });
    });

    it('matches and returns pretty printed tapes', async () => {
      flybackServer = await startFlyback({
        recordMode: 'DISABLED',
        ignoreAllHeaders: true,
      });

      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ param1: 3, param2: { subParam: 1 } });

      const res = await flybackFetch('/test/pretty', {
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

      flybackServer = await startFlyback(
        { recordMode: 'DISABLED' },
        {
          callback: () => {
            counter.count += 1;
          },
        },
      );
      expect(counter.count).toEqual(1);
    });

    it("doesn't match pretty printed tapes with different body", async () => {
      const headers = { 'content-type': 'application/json' };

      const makeRequest = async (body) => {
        const res = await flybackFetch('/test/pretty', {
          compress: false,
          method: 'POST',
          headers,
          body,
        });

        expect(res.status).toEqual(404);
      };

      flybackServer = await startFlyback({ recordMode: 'DISABLED' });

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

      flybackServer = await startFlyback({ recordMode: 'DISABLED', tapeDecorator });

      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ text: 'request-test-text' });

      const res = await flybackFetch('/test/echo', {
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
      flybackServer = await startFlyback({
        recordMode: 'OVERWRITE',
        ignoreHeaders: ['x-flyback-ping'],
      });

      const url = 'test/1';
      let headers = { 'x-flyback-ping': 'test1' };

      let res = await flybackFetch(url, { compress: false, headers });

      expect(res.status).toEqual(200);
      let resBody = await res.json();
      let expectedBody = { ok: true, body: 'test1' };

      expect(resBody).toEqual(expectedBody);

      let tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.path).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedBody);

      headers = { 'x-flyback-ping': 'test2' };

      res = await flybackFetch(url, { compress: false, headers });
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
      flybackServer = await startFlyback({ recordMode: 'DISABLED' });

      const res = await flybackFetch('/test/1', { compress: false });

      expect(res.status).toEqual(404);
    });

    it('proxies request to host on unkwown request with fallbackMode PROXY', async () => {
      flybackServer = await startFlyback({
        recordMode: 'DISABLED',
        fallbackMode: 'PROXY',
      });

      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const res = await flybackFetch('/test/1', {
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
      const logger = new Logger({} as Context);
      const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
      const tapeStoreManager = new TapeStoreManager({} as Options);

      flybackServer = await startFlyback({ recordMode: 'DISABLED', logger }, { tapeStoreManager });

      const error = new Error('Test error');

      jest.spyOn(tapeStoreManager, 'getTapeStore').mockImplementation(() => {
        throw error;
      });

      const res = await flybackFetch('/test/1', { compress: false });

      expect(loggerSpy).toHaveBeenCalledWith(error);
      expect(res.status).toEqual(500);
    });
  });

  describe('summary printing', () => {
    it('prints the summary when enabled', async () => {
      const logger = new Logger({} as Context);
      const spy = jest.spyOn(console, 'log').mockImplementation(() => 0);

      flybackServer = await startFlyback({ summary: true, logger });
      flybackServer.close();

      expect(spy).toBeCalledWith(expect.stringContaining('SUMMARY'));
    });

    it("doesn't print the summary when disabled", async () => {
      const logger = new Logger({} as Context);
      const spy = jest.spyOn(logger, 'log').mockImplementation(() => 0);

      flybackServer = await startFlyback({ summary: false, logger });
      flybackServer.close();

      expect(spy).toBeCalledWith(expect.not.stringContaining('SUMMARY'));
    });
  });

  describe('tape usage information', () => {
    // TODO
    xit('should indicate that a tape has been used after usage', async () => {
      flybackServer = await startFlyback({
        recordMode: 'DISABLED',
        summary: true,
      });

      const res = await flybackFetch('/test/3', { compress: false });

      expect(res.status).toEqual(200);

      const body = await res.json();

      expect(body).toEqual({ ok: true });
    });
  });

  describe('https', () => {
    it('should be able to run a https server', async () => {
      const flybackUrl = 'https://localhost:8886';

      flybackServer = await startFlyback({
        flybackUrl,
        recordMode: 'DISABLED',
        https: {
          keyPath: './test/e2e/cert/localhost.key',
          certPath: './test/e2e/cert/localhost.crt',
        },
      });

      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const res = await flybackFetch('/test/3', { agent, compress: false }, flybackUrl);

      expect(res.status).toEqual(200);
    });
  });

  describe('body decomression', () => {
    describe('write tape with decompressed body', () => {
      const testDecompression = async (
        bodyText: string,
        compress: (buffer: Buffer) => Buffer,
        { contentType = '', contentEncoding = '' },
      ) => {
        flybackServer = await startFlyback();
        const headers = {
          'content-type': contentType,
          'content-encoding': contentEncoding,
        };
        const url = '/test/decompression';

        const body = compress(Buffer.from(bodyText));

        apiServer.handleNextRequest((_, res) => {
          res.writeHead(200, headers);
          res.end(body);
        });

        await flybackFetch(url, {
          compress: true,
          method: 'POST',
          headers,
          body,
        });

        return readJSONFromFile(tapesPath, url);
      };

      describe('from json', () => {
        const bodyJson = { foo: 'bar', bar: 'foo', number: 100, bool: true };
        const bodyText = JSON.stringify(bodyJson);

        it('brotli', async () => {
          const tape = await testDecompression(bodyText, iltorb.compressSync, {
            contentEncoding: 'br',
            contentType: 'application/json',
          });

          expect(tape.request.body).toEqual(bodyJson);
          expect(tape.response.body).toEqual(bodyJson);
        });

        it('gzip', async () => {
          const tape = await testDecompression(bodyText, zlib.gzipSync, {
            contentEncoding: 'gzip',
            contentType: 'application/json',
          });

          expect(tape.request.body).toEqual(bodyJson);
          expect(tape.response.body).toEqual(bodyJson);
        });

        it('deflate', async () => {
          const tape = await testDecompression(bodyText, zlib.deflateSync, {
            contentEncoding: 'deflate',
            contentType: 'application/json',
          });

          expect(tape.request.body).toEqual(bodyJson);
          expect(tape.response.body).toEqual(bodyJson);
        });

        it('base64', async () => {
          const tape = await testDecompression(
            bodyText,
            (body) => Buffer.from(body.toString('base64')),
            {
              contentEncoding: 'base64',
              contentType: 'application/json',
            },
          );

          expect(tape.request.body).toEqual(bodyJson);
          expect(tape.response.body).toEqual(bodyJson);
        });
      });

      describe('from plain text', () => {
        const bodyText = 'I am happy when flyback works';

        it('brotli', async () => {
          const tape = await testDecompression(bodyText, iltorb.compressSync, {
            contentEncoding: 'br',
            contentType: 'text/plain',
          });

          expect(tape.request.body).toEqual(bodyText);
          expect(tape.response.body).toEqual(bodyText);
        });

        it('gzip', async () => {
          const tape = await testDecompression(bodyText, zlib.gzipSync, {
            contentEncoding: 'gzip',
            contentType: 'text/plain',
          });

          expect(tape.request.body).toEqual(bodyText);
          expect(tape.response.body).toEqual(bodyText);
        });

        it('deflate', async () => {
          const tape = await testDecompression(bodyText, zlib.deflateSync, {
            contentEncoding: 'deflate',
            contentType: 'text/plain',
          });

          expect(tape.request.body).toEqual(bodyText);
          expect(tape.response.body).toEqual(bodyText);
        });

        it('base64', async () => {
          const tape = await testDecompression(
            bodyText,
            (body) => Buffer.from(body.toString('base64')),
            {
              contentEncoding: 'base64',
              contentType: 'text/plain',
            },
          );

          expect(tape.request.body).toEqual(bodyText);
          expect(tape.response.body).toEqual(bodyText);
        });
      });

      describe('handles unkown encoding and charsets', () => {
        it('converts unknown content-encoding to base64', async () => {
          const jsonText = JSON.stringify({ string: 'json' });
          const base64JsonText = Buffer.from(jsonText).toString('base64');
          const tape = await testDecompression(jsonText, (buffer) => buffer, {
            contentEncoding: 'gzippeb',
            contentType: 'application/json',
          });

          expect(tape.request.body).toEqual(base64JsonText);
          expect(tape.response.body).toEqual(base64JsonText);
        });

        it('converts unknown charset to base64', async () => {
          const jsonText = JSON.stringify({ string: 'json' });
          const base64JsonText = Buffer.from(jsonText).toString('base64');
          const tape = await testDecompression(jsonText, (buffer) => buffer, {
            contentEncoding: 'base64',
            contentType: 'application/json;charset=unkown-charset',
          });

          expect(tape.request.body).toEqual(base64JsonText);
          expect(tape.response.body).toEqual(base64JsonText);
        });
      });

      describe('works with all supported encodings', () => {
        const supportedCharsets = ['utf8', 'utf-8'];

        for (const charset of supportedCharsets) {
          it(`works with ${charset} encoding`, async () => {
            const jsonText = `I work with ${charset} encoding`;
            const encodedText = Buffer.from(jsonText).toString(charset);
            const tape = await testDecompression(jsonText, (buffer) => buffer, {
              contentType: `text/plain;charset=${charset}`,
            });

            expect(tape.request.body).toEqual(encodedText);
            expect(tape.response.body).toEqual(encodedText);
          });
        }
      });
    });
  });
});
