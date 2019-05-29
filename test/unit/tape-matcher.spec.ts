import TapeMatcher from '../src/tape-matcher';
import { createTapeFromJSON, SerializedTape } from '../../src/tape';
import { createContext, Options } from '../../src/options';
import { Request } from '../../src/http';

const raw: SerializedTape = {
  meta: {
    endpoint: 'test.proxy.com',
    createdAt: new Date(),
  },
  request: {
    url: '/foo/bar/1?real=3',
    method: 'GET',
    headers: {
      accept: 'application/json',
      'content-type': 'text/plain',
      'x-ignored': '1',
    },
    body: 'ABC',
  },
  response: {
    status: 200,
    headers: {
      accept: 'application/json',
      'x-ignored': '2',
    },
    body: 'SGVsbG8=',
  },
};

const context = createContext({
  ignoreHeaders: ['x-ignored'],
  ignoreQueryParams: ['ignored1', 'ignored2'],
} as Options);

const tape = createTapeFromJSON(raw);

describe('TapeMatcher', () => {
  describe('#sameAs', () => {
    const req: Request = {
      url: '/foo/bar/1?ignored1=foo&ignored2=bar&real=3',
      method: 'GET',
      headers: {
        accept: ['application/json'],
        'content-type': ['text/plain'],
        'x-ignored': ['1'],
      },
      body: Buffer.from('QUJD', 'base64'),
    };

    it('returns true when the request body is ignored', () => {
      const newContext = {
        ...context,
        ignoreBody: true,
      };

      const newTape = createTapeFromJSON(raw);

      expect(new TapeMatcher(newTape, newContext).matches(req)).toBe(true);
    });

    it('returns true when everything is the same', () => {
      expect(new TapeMatcher(tape, context).matches(req)).toBe(true);
    });

    it('returns true when only ignored query params change', () => {
      expect(
        new TapeMatcher(tape, context).matches({ ...req, url: '/foo/bar/1?ignored1=diff&real=3' }),
      ).toBe(true);
    });

    it('returns true when all query params are ignored', () => {
      const newOpts = {
        ...context,
        ignoreQueryParams: [...context.ignoreQueryParams, 'real'],
      };

      const newTape = createTapeFromJSON(raw);
      const reqToMatch = {
        ...req,
        url: '/foo/bar/1?ignored1=diff&real=diff',
      };

      expect(new TapeMatcher(newTape, newOpts).matches(reqToMatch)).toBe(true);
    });

    it('returns true when only ignored headers change', () => {
      const headers = {
        ...req.headers,
        'x-ignored': ['diff'],
      };

      const reqToMatch = {
        ...req,
        headers,
      };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(true);
    });

    it('returns true when only headers change and ignoreAllHeaders is true', () => {
      const newOpts = {
        ...context,
        ignoreAllHeaders: true,
      };

      const headers = {
        ...req.headers,
        'x-not-ignored': ['diff'],
        'any-header': ['anything'],
      };

      const reqToMatch = {
        ...req,
        headers,
      };

      expect(new TapeMatcher(tape, newOpts).matches(reqToMatch)).toBe(true);
    });

    it('returns false when only headers change and ignoreHeaders is undefined', () => {
      const newOpts = {
        ...context,
        ignoreHeaders: undefined,
      };

      const headers = {
        ...req.headers,
        'x--ignored': ['diff'],
      };

      const reqToMatch = {
        ...req,
        headers,
      };

      expect(new TapeMatcher(tape, newOpts).matches(reqToMatch)).toBe(false);
    });

    it('returns false when the urls are different', () => {
      const reqToMatch = { ...req, url: '/bar' };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    it('returns false when the query params have different values', () => {
      const reqToMatch = { ...req, url: '/foo/bar/1?real=different' };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    it('returns false when the query params are different', () => {
      const reqToMatch = { ...req, url: '/foo/bar/1?real=3&newParam=1' };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    it('returns false when the methods are different', () => {
      const reqToMatch = { ...req, method: 'POST' };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    it('returns false when the bodies are different', () => {
      const reqToMatch = { ...req, body: Buffer.from('') };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    it('returns true when both bodies are empty', () => {
      const rawDup: SerializedTape = {
        ...raw,
        request: {
          ...raw.request,
          method: 'HEAD',
          headers: {
            ...raw.request.headers,
            'content-type': ['application/json'],
          },
          body: '',
        },
      };

      const reqDup = {
        ...req,
        method: 'HEAD',
        headers: {
          ...req.headers,
          'content-type': ['application/json'],
        },
        body: Buffer.from(''),
      };

      const newTape = createTapeFromJSON(rawDup);

      expect(new TapeMatcher(newTape, context).matches(reqDup)).toBe(true);
    });

    it('returns false when there are more headers', () => {
      const reqToMatch = {
        ...req,
        headers: {
          ...req.headers,
          foo: ['bar'],
        },
      };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    it('returns false when there are less headers', () => {
      const headers = { ...req.headers };

      delete headers['accept'];
      const reqToMatch = {
        ...req,
        headers,
      };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    it('returns false when a header has a different value', () => {
      const headers = {
        ...req.headers,
        accept: ['x-form'],
      };

      const reqToMatch = {
        ...req,
        headers,
      };

      expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
    });

    describe('tapeMatcher', () => {
      it('returns true when just the bodies are different but the tapeMatcher says they match', () => {
        const newOpts = {
          ...context,
          tapeMatcher: () => true,
        };

        const reqToMatch = { ...req, body: Buffer.from('XYZ') };

        expect(new TapeMatcher(tape, newOpts).matches(reqToMatch)).toBe(true);
      });

      it("returns false when just the bodies are different and the tapeMatcher says they don't match", () => {
        const newOpts = {
          ...context,
          tapeMatcher: () => false,
        };

        const reqToMatch = { ...req, body: Buffer.from('XYZ') };

        expect(new TapeMatcher(tape, newOpts).matches(reqToMatch)).toBe(false);
      });

      it('returns true when urls are different but the tapeMatcher says they match', () => {
        const newOpts = {
          ...context,
          tapeMatcher: () => true,
        };

        const reqToMatch = { ...req, url: '/not-same' };

        expect(new TapeMatcher(tape, newOpts).matches(reqToMatch)).toBe(true);
      });

      it("returns false when just the urls are different and the tapeMatcher says they don't match", () => {
        const newOpts = {
          ...context,
          tapeMatcher: () => false,
        };

        const reqToMatch = { ...req, url: '/not-same' };

        expect(new TapeMatcher(tape, newOpts).matches(reqToMatch)).toBe(false);
      });

      it('returns true when both bodies are undefined', () => {
        const tape = createTapeFromJSON(raw);
        const reqToMatch = { ...tape.request, body: undefined };

        tape.request.body = undefined;

        expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(true);
      });

      it('returns false when one body is truthy and other is falsy', () => {
        const tape = createTapeFromJSON(raw);
        const reqToMatch = { ...tape.request, body: undefined };

        expect(new TapeMatcher(tape, context).matches(reqToMatch)).toBe(false);
      });

      it('returns true when url bases are the same and ignoreAllQueryParams is true', () => {
        const newOpts = {
          ...context,
          ignoreAllQueryParams: true,
        };

        const reqToMatch = { ...req, url: '/foo/bar/1?some?other?args' };

        expect(new TapeMatcher(tape, newOpts).matches(reqToMatch)).toBe(true);
      });
    });
  });
});
