import Tape, { TapeJson } from '../../src/tape';
import { mockContext } from './mocks';

describe('Tape', () => {
  const context = mockContext();

  it('creates a tape from the json', () => {
    const tapeJson: TapeJson = {
      request: {
        path: '/foo/bar/1?real=3',
        method: 'POST',
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

    const tape = Tape.fromJSON(tapeJson, context);

    expect(tape.toJSON()).toEqual(tapeJson);
  });

  it('creates a tape from the json with request and response not human readable', () => {
    const tapeJson: TapeJson = {
      request: {
        path: '/foo/bar/1?real=3',
        method: 'POST',
        headers: {
          accept: 'text/unknown',
          'content-type': 'text/plain',
          'multi-value-header': ['value-a', 'value-b'],
          'x-ignored': '1',
        },
        body: 'SGVsbG8=',
      },
      response: {
        status: 200,
        headers: {
          'content-type': 'text/unknown',
          'x-ignored': '2',
        },
        body: Buffer.from('ABC').toString('base64'),
      },
    };

    const tape = Tape.fromJSON(tapeJson, context);

    expect(tape.toJSON()).toEqual(tapeJson);
  });

  it('can read pretty JSON in body', () => {
    const tapeJson: TapeJson = {
      request: {
        path: '/foo/bar/1?real=3',
        method: 'PUT',
        headers: {
          accept: 'text/unknown',
          'content-type': 'application/json',
          'multi-value-header': ['value-a', 'value-b'],
          'x-ignored': '1',
          'content-length': '39',
        },
        body: {
          param: 'value',
          nested: {
            param2: 3,
          },
        },
      },
      response: {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-ignored': '2',
          'content-length': '46',
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

    const tape = Tape.fromJSON(tapeJson, context);

    expect(tape.toJSON()).toEqual(tapeJson);
  });

  it('creates a tape from the json with request and response that dont have bodies', () => {
    const tapeJson: TapeJson = {
      request: {
        path: '/foo/bar/1?real=3',
        method: 'DELETE',
        headers: {
          accept: 'text/unknown',
          'content-type': 'text/plain',
          'multi-value-header': ['value-a', 'value-b'],
          'x-ignored': '1',
        },
        body: '',
      },
      response: {
        status: 200,
        headers: {
          'content-type': 'text/unknown',
          'x-ignored': '2',
        },
        body: '',
      },
    };

    const tape = Tape.fromJSON(tapeJson, context);

    expect(tape.toJSON()).toEqual(tapeJson);
  });

  it('decorates tape when tapeDecorator is specified', () => {
    const context = mockContext({
      tapeDecorator: (tape) => {
        return {
          ...tape,
          request: {
            ...tape.request,
            method: 'TEST',
          },
        };
      },
    });

    const tapeJson: TapeJson = {
      request: {
        path: '/foo/bar/1?real=3',
        method: 'DELETE',
        headers: {
          accept: 'text/unknown',
          'content-type': 'text/plain',
          'multi-value-header': ['value-a', 'value-b'],
          'x-ignored': '1',
        },
      },
      response: {
        status: 200,
        headers: {
          'content-type': 'text/unknown',
          'x-ignored': '2',
        },
      },
    };

    const tape = Tape.fromJSON(tapeJson, context);

    expect(tape.toJSON().request.method).toEqual('TEST');
  });

  it('returns correct pathname', () => {
    const tapeJson: TapeJson = {
      request: {
        path: '/foo/bar/1?real=3',
        method: 'GET',
        headers: {},
      },
      response: {
        status: 200,
        headers: {},
      },
    };

    const tape = Tape.fromJSON(tapeJson, context);

    expect(tape.pathname).toBe('/foo/bar/1');
  });

  describe('Tape name', () => {
    const tapeJson: TapeJson = {
      request: {
        path: '/api/v3/money?sorting=decrease',
        method: 'GET',
        headers: {},
      },
      response: {
        status: 200,
        headers: {},
      },
    };

    it('returns correct tape name', () => {
      const tape = Tape.fromJSON(tapeJson, context);

      expect(tape.name).toBe('api.v3.money');
    });

    it('returns correct tape name when use a tapeNameGenerator', () => {
      const context = mockContext({
        tapeNameGenerator: ({ path, method }) => {
          return method + path.replace(/\//g, '.');
        },
      });

      const tape = Tape.fromJSON(tapeJson, context);

      expect(tape.name).toBe('GET.api.v3.money?sorting=decrease');
    });

    it('returns correct tape name when use a tapeNameGenerator and it doesnt return extension', () => {
      const tape = Tape.fromJSON(tapeJson, context);

      expect(tape.name).toBe('api.v3.money');
    });
  });
});
