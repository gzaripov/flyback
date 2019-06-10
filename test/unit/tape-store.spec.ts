import fs from 'fs';
import path from 'path';
import Tape, { TapeJson } from '../../src/tape';
import TapeStore from '../../src/tape-store';
import { createContext } from '../../src/context';
import { mockTapesPath } from './mocks';

const tapeJson: TapeJson = {
  request: {
    path: '/foo/bar/1?real=3',
    method: 'POST',
    headers: {
      accept: 'text/unknown',
      'content-type': 'text/plain',
      testpath: path.normalize(`${path.join(__dirname, 'tapes')}/`),
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

describe('Tape Store', () => {
  it('saves tape to path from meta info', () => {
    const tapesPath = mockTapesPath();
    const context = createContext({
      tapesPath,
    });

    const tape = Tape.fromJSON(tapeJson, context);
    const tapeStore = new TapeStore(tapesPath, context);
    const tapeFilePath = path.join(tapesPath, `${tape.name}.json`);

    tapeStore.save(tape);

    expect(fs.existsSync(tapeFilePath)).toBe(true);
  });

  it('saves tape to path from tapePathGenerator', () => {
    const tapesPath = mockTapesPath();
    const testName = 'test-tape.json';

    const context = createContext({
      tapePathGenerator: (request) => request.headers['x-tape-path'] as string,
      tapeNameGenerator: () => testName,
    });

    const tape = Tape.fromJSON(tapeJson, context);
    const tapeStore = new TapeStore(tapesPath, context);

    tapeStore.save(tape);

    expect(fs.existsSync(path.join(tapesPath, testName))).toBe(true);
  });
});
