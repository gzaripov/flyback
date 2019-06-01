import fs from 'fs';
import path from 'path';
import Tape, { TapeJson } from '../../src/tape';
import TapeStore from '../../src/tape-store';
import { createContext } from '../../src/options';

const tapeJson: TapeJson = {
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
    const context = createContext({
      proxyUrl: 'localhost:8080',
      tapesPath: '/tmp/tapes',
      silent: true,
    });

    const tape = Tape.fromJSON(tapeJson, context);
    const tapeStore = new TapeStore(context);

    tape.meta.path = 'example-tape.json';

    tapeStore.save(tape);

    expect(fs.existsSync(path.join(context.tapesPath, tape.meta.path))).toBe(true);
  });

  it('saves tape to path from tapePathGenerator', () => {
    const testDir = '/tmp/tapes';
    const testName = 'test-tape.json';

    const context = createContext({
      proxyUrl: 'localhost:8080',
      silent: true,
      tapePathGenerator: (tape) => tape.headers['x-tape-path'][0],
      tapeNameGenerator: () => testName,
    });

    const tape = Tape.fromJSON(tapeJson, context);
    const tapeStore = new TapeStore(context);

    tape.request.headers['x-tape-path'] = [testDir];

    tapeStore.save(tape);

    expect(fs.existsSync(path.join(testDir, testName))).toBe(true);
  });

  it('throws error when there is no tapesPath and tapePathGenerator', () => {
    const testDir = '/tmp/tapes';
    const testName = 'test-tape';

    const context = createContext({
      proxyUrl: 'localhost:8080',
      silent: true,
      tapeNameGenerator: () => testName,
    });

    const tape = Tape.fromJSON(tapeJson, context);
    const tapeStore = new TapeStore(context);

    tape.request.headers['x-tape-path'] = [testDir];

    expect(() => tapeStore.save(tape)).toThrow(
      new Error(`Cant create path for tape ${tape.request.url}`),
    );
  });
});
