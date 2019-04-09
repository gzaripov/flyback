import path from 'path';
import TapeStoreManager from '../src/tape-store-manager';
import Tape from '../src/tape';
import { prepareOptions } from '../src/options';

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
      testpath: path.normalize(`${path.join(__dirname, 'tapes')}/`),
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

describe('TapeStoreManager', () => {
  it('returns store with path from tapePathGenerator', () => {
    const opts = prepareOptions({
      proxyUrl: 'localhost:8080',
      tapePathGenerator: (tape) => {
        return tape.request.headers.testpath[0];
      },
    });

    const tape = Tape.fromJSON(raw, opts);
    const tapeStoreManager = new TapeStoreManager(opts);

    const tapeStore = tapeStoreManager.getTapeStore(tape);

    expect(tapeStore.hasPath(raw.req.headers.testpath)).toBe(true);
  });
});
