import TapeStoreManager from '../../src/tape-store-manager';
import { mockContext, mockTapesPath, mockTape } from './mocks';
import { Request } from '../../src/http';
import { RequestJson } from '../../src/http/request';

const requestJson: RequestJson = {
  path: '/foo/bar/1?real=3',
  method: 'POST',
  headers: {
    accept: ['text/unknown'],
    'content-type': ['text/plain'],
  },
  body: 'ABC',
};

describe('TapeStoreManager', () => {
  it('returns store with path from tapePathGenerator', () => {
    const tapesPath = mockTapesPath();
    const context = mockContext({
      tapePathGenerator: () => tapesPath,
    });

    const request = Request.fromJson(requestJson, context);
    const tapeStoreManager = new TapeStoreManager(context);
    const tapeStore = tapeStoreManager.getTapeStore(request);

    expect(tapeStore.hasPath(tapesPath)).toBe(true);
  });

  it('returns the same store second on same path', () => {
    const tapesPath = mockTapesPath();
    const context = mockContext({
      tapePathGenerator: () => tapesPath,
    });

    const request = Request.fromJson(requestJson, context);
    const tapeStoreManager = new TapeStoreManager(context);

    const tapeStoreFirst = tapeStoreManager.getTapeStore(request);
    const tapeStoreSecond = tapeStoreManager.getTapeStore(request);

    expect(tapeStoreFirst).toBe(tapeStoreSecond);
  });

  it('throws error when there is no tapesPath and tapePathGenerator', () => {
    const context = mockContext();

    const request = Request.fromJson(requestJson, context);
    const tapeStoreManager = new TapeStoreManager(context);

    expect(() => tapeStoreManager.getTapeStore(request)).toThrow(
      new Error('Cant find path for tape store, use tapesPath or tapePathGenerator options'),
    );
  });

  it('returns default tape store when there is tapePathGenerator but it return empty value', () => {
    const tapesPath = mockTapesPath();
    const context = mockContext({
      tapesPath,
      tapePathGenerator: () => '',
    });

    const request = Request.fromJson(requestJson, context);
    const tapeStoreManager = new TapeStoreManager(context);

    expect(() => tapeStoreManager.getTapeStore(request)).not.toThrow(expect.any(Error));
  });

  it('getAllTapes returns all tapes from all stores', () => {
    const tapesPath = mockTapesPath();
    const tapeMock = mockTape({ request: requestJson });
    const context = mockContext({
      tapePathGenerator: () => tapesPath,
    });

    const tapeStoreManager = new TapeStoreManager(context);
    const tapeStore = tapeStoreManager.getTapeStore(Request.fromJson(requestJson, context));

    expect(tapeStoreManager.getAllTapes()).toEqual([]);

    tapeStore.save(tapeMock);

    expect(tapeStoreManager.getAllTapes()).toEqual([tapeMock]);
  });
});
