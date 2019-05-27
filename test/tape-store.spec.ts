import fs from 'fs';
import path from 'path';
import { TapeJson, createTapeFromJSON } from '../src/tape';
import TapeStore from '../src/tape-store';
import { createContext } from '../src/options';

const serializedTape: TapeJson = {
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

describe('Tape Store', () => {
  it('saves tape to path from meta info', () => {
    const opts = createContext({
      proxyUrl: 'localhost:8080',
      tapesPath: '/tmp/tapes',
      silent: true,
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStore = new TapeStore(opts);

    tape.meta.path = 'example-tape.json';

    tapeStore.save(tape);

    expect(fs.existsSync(path.join(opts.tapesPath, tape.meta.path))).toBe(true);
  });

  it('saves tape to path from tapePathGenerator', () => {
    const testDir = '/tmp/tapes';
    const testName = 'test-tape.json';

    const opts = createContext({
      proxyUrl: 'localhost:8080',
      silent: true,
      tapePathGenerator: (tape) => tape.headers['x-tape-path'][0],
      tapeNameGenerator: () => testName,
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStore = new TapeStore(opts);

    tape.request.headers['x-tape-path'] = [testDir];

    tapeStore.save(tape);

    expect(fs.existsSync(path.join(testDir, testName))).toBe(true);
  });

  it('throws error when there is no tapesPath and tapePathGenerator', () => {
    const testDir = '/tmp/tapes';
    const testName = 'test-tape';

    const opts = createContext({
      proxyUrl: 'localhost:8080',
      silent: true,
      tapeNameGenerator: () => testName,
    });

    const tape = createTapeFromJSON(serializedTape);
    const tapeStore = new TapeStore(opts);

    tape.request.headers['x-tape-path'] = [testDir];

    expect(() => tapeStore.save(tape)).toThrow(
      new Error(`Cant create path for tape ${tape.request.url}`),
    );
  });
});
