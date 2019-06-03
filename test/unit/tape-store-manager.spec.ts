import path from 'path';
import TapeStoreManager from '../../src/tape-store-manager';
import { SerializedTape, createTapeFromJSON } from '../../src/tape';
import { createContext } from '../../src/options';

const serializedTape: SerializedTape = {
  meta: {
    endpoint: 'test.localhost.proxy',
    createdAt: new Date(),
  },
  request: {
    url: '/foo/bar/1?real=3',
    method: 'GET',
    headers: {
      accept: ['text/unknown'],
      'content-type': ['text/plain'],
      testpath: [path.normalize(`${path.join(__dirname, 'tapes')}/`)],
    },
    body: 'ABC',
  },
  response: {
    status: 200,
    headers: {
      'content-type': ['text/unknown'],
      'x-ignored': ['2'],
    },
    body: Buffer.from('Hello').toString('base64'),
  },
};

describe('TapeStoreManager', () => {
  it('returns store with path from tapePathGenerator', () => {
    const opts = createContext({
      silent: true,
      proxyUrl: 'localhost:8080',
      tapePathGenerator: (request) => {
        return request.headers.testpath[0];
      },
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStoreManager = new TapeStoreManager(opts);

    const tapeStore = tapeStoreManager.getTapeStore(tape.request);

    expect(tapeStore.hasPath(serializedTape.request.headers.testpath[0])).toBe(true);
  });

  it('returns the same store second on same path', () => {
    const opts = createContext({
      proxyUrl: 'localhost:8080',
      tapePathGenerator: (request) => {
        return request.headers.testpath[0];
      },
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStoreManager = new TapeStoreManager(opts);

    const tapeStoreFirst = tapeStoreManager.getTapeStore(tape.request);
    const tapeStoreSecond = tapeStoreManager.getTapeStore(tape.request);

    expect(tapeStoreFirst).toBe(tapeStoreSecond);
  });

  it('throws error when there is no tapesPath and tapePathGenerator', () => {
    const opts = createContext({
      silent: true,
      proxyUrl: 'localhost:8080',
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStoreManager = new TapeStoreManager(opts);

    expect(() => tapeStoreManager.getTapeStore(tape.request)).toThrow(
      new Error(
        'Cant find path for tape store, use options.tapesPath or options.tapePathGenerator',
      ),
    );
  });

  it('returns default tape store when there is tapePathGenerator but it return empty value', () => {
    const opts = createContext({
      silent: true,
      proxyUrl: 'localhost:8080',
      tapePathGenerator: () => '',
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStoreManager = new TapeStoreManager(opts);

    expect(() => tapeStoreManager.getTapeStore(tape.request)).toThrow(
      new Error(
        'Cant find path for tape store, use options.tapesPath or options.tapePathGenerator',
      ),
    );
  });

  it('resets tape store usage when path is provided', () => {
    const opts = createContext({
      silent: true,
      proxyUrl: 'localhost:8080',
      tapesPath: '/tmp/test-tape-1/',
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStoreManager = new TapeStoreManager(opts);

    const tapeStore = tapeStoreManager.getTapeStore(tape.request);

    jest.spyOn(tapeStore, 'resetTapeUsage');
    jest.spyOn(tapeStoreManager, 'resetTapeUsage');

    tapeStoreManager.resetTapeUsage('/tmp/test-tape-1/');

    expect(tapeStore.resetTapeUsage).toHaveBeenCalled();
    expect(tapeStoreManager.resetTapeUsage).toReturnWith(true);
  });

  it('return false when resets tape store usage, path is provided and no store found', () => {
    const opts = createContext({
      silent: true,
      proxyUrl: 'localhost:8080',
      tapesPath: '/tmp/test-tape-2/',
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStoreManager = new TapeStoreManager(opts);

    const tapeStore = tapeStoreManager.getTapeStore(tape.request);

    jest.spyOn(tapeStore, 'resetTapeUsage');
    jest.spyOn(tapeStoreManager, 'resetTapeUsage');

    tapeStoreManager.resetTapeUsage('/tmp/test-tape-4/');

    expect(tapeStore.resetTapeUsage).not.toHaveBeenCalled();
    expect(tapeStoreManager.resetTapeUsage).toReturnWith(false);
  });
});
