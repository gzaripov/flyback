import path from 'path';
import TapeStoreManager from '../src/tape-store-manager';
import { SerializedTape, createTapeFromJSON } from '../src/tape';
import { prepareOptions } from '../src/options';

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
    const opts = prepareOptions({
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
});
