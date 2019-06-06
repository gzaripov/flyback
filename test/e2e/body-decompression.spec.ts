import zlib from 'zlib';
import iltorb from 'iltorb';
import { flybackFetch, tapesPath, readJSONFromFile } from './flyback-server';
import { apiServer } from './api-server';

const testDecompression = async (
  bodyText: string,
  compress: (buffer: Buffer) => Buffer,
  { contentType = '', contentEncoding = '' },
) => {
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

describe('body decomression', () => {
  describe('write tape with decompressed body', () => {
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
