import TapeRenderer from '../src/tape-renderer';
import { prepareOptions } from '../src/options';
import Tape from '../src/tape';

const raw = {
  meta: {
    createdAt: new Date(),
    reqHumanReadable: true,
    resHumanReadable: false,
  },
  req: {
    url: '/foo/bar/1?real=3',
    method: 'GET',
    headers: {
      accept: 'text/unknown',
      'content-type': 'text/plain',
      'x-ignored': '1',
    },
    body: 'ABC',
  },
  res: {
    status: 200,
    headers: {
      'content-type': ['text/unknown'],
      'x-ignored': ['2'],
    },
    body: Buffer.from('Hello').toString('base64'),
  },
};

const opts = prepareOptions({
  proxyUrl: 'http://localhost:8080',
  ignoreHeaders: ['x-ignored'],
  ignoreQueryParams: ['ignored1', 'ignored2'],
});

const tape = Tape.fromJSON(raw, opts);

describe('TapeRenderer', () => {
  describe('.fromStore', () => {
    it('creates a tape from the raw file data with req and res human readable', () => {
      expect(tape.request.url).toEqual('/foo/bar/1?real=3');
      expect(tape.request.headers['accept']).toEqual('text/unknown');
      expect(tape.request.headers['x-ignored']).toBe(undefined);
      expect(tape.request.body.equals(Buffer.from('ABC'))).toBe(true);

      expect(tape.response.headers['content-type']).toEqual(['text/unknown']);
      expect(tape.response.headers['x-ignored']).toEqual(['2']);
      expect(tape.response.body.equals(Buffer.from('Hello'))).toBe(true);
    });

    it('creates a tape from the raw file data with req and res not human readable', () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          reqHumanReadable: false,
          resHumanReadable: true,
        },
        req: {
          ...raw.req,
          body: 'SGVsbG8=',
        },
        res: {
          ...raw.res,
          body: 'ABC',
        },
      };

      const tape = Tape.fromJSON(newRaw, opts);

      expect(tape.request.url).toEqual('/foo/bar/1?real=3');
      expect(tape.request.headers['accept']).toEqual('text/unknown');
      expect(tape.request.headers['x-ignored']).toBe(undefined);
      expect(tape.request.body.equals(Buffer.from('Hello'))).toBe(true);

      expect(tape.response.headers['content-type']).toEqual(['text/unknown']);
      expect(tape.response.headers['x-ignored']).toEqual(['2']);
      expect(tape.response.body.equals(Buffer.from('ABC'))).toBe(true);
    });

    it('can read pretty JSON', () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          reqHumanReadable: true,
          resHumanReadable: true,
        },
        req: {
          ...raw.req,
          headers: {
            ...raw.req.headers,
            'content-type': 'application/json',
            'content-length': 20,
          },
          body: {
            param: 'value',
            nested: {
              param2: 3,
            },
          },
        },
        res: {
          ...raw.res,
          headers: {
            ...raw.res.headers,
            'content-type': ['application/json'],
            'content-length': [20],
          },
          body: {
            foo: 'bar',
            utf8: '🔤',
            nested: {
              fuu: 3,
            },
          },
        },
      };

      let tape = Tape.fromJSON(newRaw, opts);

      expect(tape.request.body).toEqual(Buffer.from(JSON.stringify(newRaw.req.body, null, 2)));

      expect(tape.response.body).toEqual(Buffer.from(JSON.stringify(newRaw.res.body, null, 2)));
      expect(tape.response.headers['content-length']).toEqual([68]);

      delete newRaw.res.headers['content-length'];
      tape = Tape.fromJSON(newRaw, opts);
      expect(tape.response.headers['content-length']).toEqual(undefined);
    });
  });

  describe('#render', () => {
    it('renders a tape', () => {
      const rawDup = {
        ...raw,
        req: {
          ...raw.req,
          headers: {
            ...raw.req.headers,
          },
        },
      };

      delete rawDup.req.headers['x-ignored'];

      expect(new TapeRenderer(tape).render()).toEqual(rawDup);
    });

    it('renders json response as an object', () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          resHumanReadable: true,
        },
        req: {
          ...raw.req,
          headers: {
            ...raw.req.headers,
          },
        },
        res: {
          ...raw.res,
          headers: {
            ...raw.res.headers,
            'content-type': ['application/json'],
            'content-length': [20],
          },
          body: {
            foo: 'bar',
            nested: {
              fuu: 3,
            },
          },
        },
      };
      const newTape = Tape.fromJSON(newRaw, opts);

      delete newRaw.req.headers['x-ignored'];
      expect(new TapeRenderer(newTape).render()).toEqual(newRaw);
    });

    it('renders tapes with empty bodies', () => {
      const newRaw = {
        ...raw,
        req: {
          ...raw.req,
          body: '',
          method: 'HEAD',
          headers: {
            ...raw.req.headers,
            'content-type': ['application/json'],
          },
        },
        res: {
          ...raw.res,
          headers: {
            ...raw.res.headers,
            'content-type': ['application/json'],
          },
          body: '',
        },
      };
      const newTape = Tape.fromJSON(newRaw, opts);

      delete newRaw.req.headers['x-ignored'];
      expect(new TapeRenderer(newTape).render()).toEqual(newRaw);
    });
  });
});
