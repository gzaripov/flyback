import TapeRenderer from '../src/tape-renderer';
import { createTapeFromJSON, TapeJson } from '../src/tape';

const serializedTape: TapeJson = {
  request: {
    url: '/foo/bar/1?real=3',
    method: 'GET',
    headers: {
      accept: 'text/unknown',
      'content-type': 'text/plain',
      'multi-value-header': ['value-a', 'value-b'],
      'x-ignored': '1',
    },
    body: 'ABC',
  },
  response: {
    status: 200,
    headers: {
      'content-type': 'text/unknown',
      'x-ignored': '2',
    },
    body: Buffer.from('Hello').toString('base64'),
  },
};

const tape = createTapeFromJSON(serializedTape);

describe('Tape', () => {
  describe('.fromJSON', () => {
    it('creates a tape from the json', () => {
      expect(tape.request.url).toEqual('/foo/bar/1?real=3');
      expect(tape.request.headers['accept'][0]).toEqual('text/unknown');
      expect(tape.request.headers['x-ignored'][0]).toBe('1');
      expect(tape.request.headers['multi-value-header']).toEqual(['value-a', 'value-b']);
      expect(tape.request.body).toEqual(Buffer.from('ABC'));

      expect(tape.response.headers['content-type']).toEqual(['text/unknown']);
      expect(tape.response.headers['x-ignored']).toEqual(['2']);
      expect(tape.response.body).toEqual(
        Buffer.from(Buffer.from('Hello').toString('base64'), 'base64'),
      );
    });

    it('creates a tape from the json with req and res not human readable', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        meta: {
          ...serializedTape.meta,
        },
        request: {
          ...serializedTape.request,
          body: 'SGVsbG8=',
        },
        response: {
          ...serializedTape.response,
          body: Buffer.from('ABC').toString('base64'),
        },
      };

      const tape = createTapeFromJSON(newRaw);

      expect(tape.request.url).toEqual('/foo/bar/1?real=3');
      expect(tape.request.headers['accept']).toEqual(['text/unknown']);
      expect(tape.request.headers['x-ignored']).toEqual(['1']);
      expect(tape.request.body).toEqual(Buffer.from('SGVsbG8='));

      expect(tape.response.headers['content-type']).toEqual(['text/unknown']);
      expect(tape.response.headers['x-ignored']).toEqual(['2']);
      expect(tape.response.body).toEqual(Buffer.from('ABC'));
    });

    it('can read pretty JSON', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        meta: {
          ...serializedTape.meta,
        },
        request: {
          ...serializedTape.request,
          headers: {
            ...serializedTape.request.headers,
            'content-type': ['application/json'],
            'content-length': ['20'],
          },
          body: JSON.stringify({
            param: 'value',
            nested: {
              param2: 3,
            },
          }),
        },
        response: {
          ...serializedTape.response,
          headers: {
            ...serializedTape.response.headers,
            'content-type': ['application/json'],
            'content-length': ['20'],
          },
          body: JSON.stringify({
            foo: 'bar',
            utf8: '🔤',
            nested: {
              fuu: 3,
            },
          }),
        },
      };

      let tape = createTapeFromJSON(newRaw);

      expect(tape.request.body).toEqual(Buffer.from(newRaw.request.body));

      expect(tape.response.body).toEqual(Buffer.from(newRaw.response.body));
      expect(tape.response.headers['content-length']).toEqual(['20']);

      delete newRaw.response.headers['content-length'];
      tape = createTapeFromJSON(newRaw);
      expect(tape.response.headers['content-length']).toEqual(undefined);
    });
  });

  describe('#render', () => {
    it('renders a tape', () => {
      const rawDup: SerializedTape = {
        ...serializedTape,
        request: {
          ...serializedTape.request,
          headers: {
            ...serializedTape.request.headers,
          },
        },
      };

      expect(new TapeRenderer(tape).render()).toEqual(rawDup);
    });

    it('renders json response as an object', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        meta: {
          ...serializedTape.meta,
        },
        request: {
          ...serializedTape.request,
          headers: {
            ...serializedTape.request.headers,
          },
        },
        response: {
          ...serializedTape.response,
          headers: {
            ...serializedTape.response.headers,
            'content-type': 'application/json',
            'content-length': '20',
          },
          body: JSON.stringify({
            foo: 'bar',
            nested: {
              fuu: 3,
            },
          }),
        },
      };
      const newTape = createTapeFromJSON(newRaw);

      expect(new TapeRenderer(newTape).render()).toEqual(newRaw);
    });

    it('renders tapes with empty bodies', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        request: {
          ...serializedTape.request,
          body: '',
          method: 'HEAD',
          headers: {
            ...serializedTape.request.headers,
            'content-type': 'application/json',
          },
        },
        response: {
          ...serializedTape.response,
          headers: {
            ...serializedTape.response.headers,
            'content-type': 'application/json',
          },
          body: '',
        },
      };
      const newTape = createTapeFromJSON(newRaw);

      expect(new TapeRenderer(newTape).render()).toEqual(newRaw);
    });

    it('renders tapes without bodies', () => {
      const raw: SerializedTape = {
        ...serializedTape,
        request: {
          ...serializedTape.request,
          method: 'HEAD',
          headers: {
            ...serializedTape.request.headers,
            'content-type': ['application/json'],
          },
        },
        response: {
          ...serializedTape.response,
          headers: {
            ...serializedTape.response.headers,
            'content-type': ['application/json'],
          },
        },
      };

      delete raw.request.body;
      delete raw.response.body;

      const tape = createTapeFromJSON(raw);

      const expected: SerializedTape = JSON.parse(JSON.stringify(raw));

      const renderedTape = new TapeRenderer(tape).render();

      expect(renderedTape.request.body).toEqual(expected.request.body);
      expect(renderedTape.response.body).toEqual(expected.response.body);
    });
  });
});
