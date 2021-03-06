import fs from 'fs';
import { TapeJson } from '../../src/tape';
import { Options, RecordMode } from '../../src/context';
import { apiUrl } from './api-server';
import { flybackFetch, flybackUrl, tapesPath, readJSONFromFile } from './flyback-server';

describe('flyback RecordModes', () => {
  describe('record mode NEW', () => {
    it('proxies and creates a new tape when the POST request is unknown with human readable req and res', async () => {
      const reqBody = { foo: 'bar' };
      const headers = { 'content-type': 'application/json' };
      const url = '/test/1';

      const response = await flybackFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
      });

      expect(response.status).toEqual(200);

      const expectedResBody = { ok: true, body: { foo: 'bar' } };
      const body = await response.json();
      const tape = readJSONFromFile(tapesPath, url);

      expect(body).toEqual(expectedResBody);
      expect(tape.request.pathname).toEqual('/test/1');
      expect(tape.request.body).toEqual(reqBody);
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the GET request is unknown', async () => {
      const url = '/test/1';
      const res = await flybackFetch(url, { method: 'GET' });

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: null };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.pathname).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the POST request is unknown with human readable req and res', async () => {
      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const url = `test/1`;
      const res = await flybackFetch(url, {
        method: 'POST',
        headers,
        body: reqBody,
      });

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: { foo: 'bar' } };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.pathname).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedResBody);
    });

    it('proxies and creates a new tape when the HEAD request is unknown', async () => {
      const headers = { 'content-type': 'application/json' };
      const url = 'test/head';
      const res = await flybackFetch(url, { method: 'HEAD', headers });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.pathname).toEqual('/test/head');
      expect(tape.request.body).toBeUndefined();
      expect(tape.response.body).toBeUndefined();
    });

    it('proxies and creates a new tape with a custom tape name generator', async () => {
      const url = `/test/1`;
      const res = await flybackFetch(url, { method: 'GET' });

      expect(res.status).toEqual(200);

      const tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.pathname).toEqual(url);
    });

    it('decorates proxied responses', async () => {
      const tapeDecorator = (tape: TapeJson) => {
        const location = tape.response.headers['location'];

        if (typeof location === 'string') {
          tape.response.headers['location'] = [location.replace(apiUrl, flybackUrl)];
        }

        return tape;
      };

      const response = await flybackFetch(
        '/test/redirect/1',
        {
          method: 'GET',
          redirect: 'manual',
        },
        { tapeDecorator },
      );

      expect(response.status).toEqual(302);

      const location = response.headers.get('location');

      expect(location).toEqual(`${flybackUrl}/test/1`);
    });

    it('handles when the proxied server returns a 500', async () => {
      const path = 'test/3/500';
      const res = await flybackFetch(path);

      expect(res.status).toEqual(500);

      const tape = readJSONFromFile(tapesPath, path);

      expect(tape.request.pathname).toEqual('/test/3/500');
      expect(tape.response.status).toEqual(500);
    });

    it('loads existing tapes and uses them if they match', async () => {
      const res = await flybackFetch('/test/3', {}, { recordMode: 'DISABLED' });

      expect(res.status).toEqual(200);

      const body = await res.json();

      expect(body).toEqual({ ok: true });
    });

    it('matches and returns pretty printed tapes', async () => {
      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ param1: 3, param2: { subParam: 1 } });

      const res = await flybackFetch(
        '/test/pretty',
        {
          method: 'POST',
          headers,
          body,
        },
        {
          recordMode: 'DISABLED',
          ignoreAllHeaders: true,
        },
      );

      expect(res.status).toEqual(200);

      const resClone = res.clone();

      const resBody = await res.json();

      expect(resBody).toEqual({ ok: true, foo: { bar: 3 } });

      const resBodyAsText = await resClone.text();

      expect(JSON.parse(resBodyAsText)).toEqual({ ok: true, foo: { bar: 3 } });
    });

    it("doesn't match pretty printed tapes with different body", async () => {
      const headers = { 'content-type': 'application/json' };

      const makeRequest = async (body) => {
        const res = await flybackFetch(
          '/test/pretty',
          {
            method: 'POST',
            headers,
            body,
          },
          { recordMode: 'DISABLED' },
        );

        expect(res.status).toEqual(404);
      };

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

      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ text: 'request-test-text' });
      const res = await flybackFetch(
        '/test/echo',
        {
          method: 'POST',
          headers,
          body,
        },
        {
          recordMode: 'DISABLED',
          ignoreHeaders: ['content-length', 'accept-encoding'],
          tapeDecorator,
        },
      );

      const responseBody = await res.json();

      expect(res.status).toEqual(200);
      expect(responseBody).toEqual({ text: 'response-test-text__decorated' });
    });
  });

  describe('record mode OVERWRITE', () => {
    it('overwrites an existing tape', async () => {
      const flybackOpts: Partial<Options> = {
        recordMode: 'OVERWRITE',
        ignoreHeaders: ['x-flyback-ping'],
      };

      const url = 'test/1';
      let headers = { 'x-flyback-ping': 'test1' };

      let res = await flybackFetch(url, { headers }, flybackOpts);

      expect(res.status).toEqual(200);
      let resBody = await res.json();
      let expectedBody = { ok: true, body: 'test1' };

      expect(resBody).toEqual(expectedBody);

      let tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.pathname).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedBody);

      headers = { 'x-flyback-ping': 'test2' };

      res = await flybackFetch(url, { headers }, flybackOpts);
      expect(res.status).toEqual(200);
      resBody = await res.json();
      expectedBody = { ok: true, body: 'test2' };
      expect(resBody).toEqual(expectedBody);

      tape = readJSONFromFile(tapesPath, url);

      expect(tape.request.pathname).toEqual('/test/1');
      expect(tape.response.body).toEqual(expectedBody);
    });
  });

  describe('record mode DISABLED', () => {
    it('returns a 404 on unkwown request with fallbackMode NOT_FOUND (default)', async () => {
      const res = await flybackFetch('/test/1', {}, { recordMode: 'DISABLED' });

      expect(res.status).toEqual(404);
    });

    it('proxies request to host on unkwown request with fallbackMode PROXY', async () => {
      const reqBody = JSON.stringify({ foo: 'bar' });
      const headers = { 'content-type': 'application/json' };
      const res = await flybackFetch(
        '/test/1',
        {
          method: 'POST',
          headers,
          body: reqBody,
        },
        {
          recordMode: 'DISABLED',
          fallbackMode: 'PROXY',
        },
      );

      expect(res.status).toEqual(200);

      const expectedResBody = { ok: true, body: { foo: 'bar' } };
      const body = await res.json();

      expect(body).toEqual(expectedResBody);

      expect(fs.existsSync(`${tapesPath}/unnamed-3.json`)).toEqual(false);
    });
  });

  describe('record mode PROXY', () => {
    it('proxies request', async () => {
      const url = '/test/3';

      const response = await flybackFetch(
        url,
        {
          method: 'GET',
          headers: { 'record-mode': 'disabled' },
        },
        {
          recordMode: 'PROXY',
          ignoreAllHeaders: true,
        },
      );

      expect(response.status).toEqual(500);
    });
  });

  describe('record mode function', () => {
    it('allows dynamically pass record mode', async () => {
      const url = '/test/3';

      const recordMode = (request) => {
        if (typeof request.headers['record-mode'] === 'string') {
          return request.headers['record-mode'].toUpperCase() as RecordMode;
        }

        return 'PROXY';
      };

      const responseWithDisabledRm = await flybackFetch(
        url,
        {
          method: 'GET',
          headers: { 'record-mode': 'disabled' },
        },
        {
          recordMode,
          ignoreAllHeaders: true,
        },
      );

      expect(responseWithDisabledRm.status).toEqual(200);

      const responseWithProxyRm = await flybackFetch(
        url,
        {
          method: 'GET',
          headers: { 'record-mode': 'proxy' },
        },
        {
          recordMode,
          ignoreAllHeaders: true,
        },
      );

      expect(responseWithProxyRm.status).toEqual(500);
    });
  });
});
