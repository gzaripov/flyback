import TapeAnalyzer from '../../src/tape-analyzer';
import { mockTapeFile } from './mocks';

describe('Tape Analyzer', () => {
  it.only('collects statistics', () => {
    const tapeFile = mockTapeFile({
      request: { pathname: '/test/1' },
    });
    const tapeFile2 = mockTapeFile({
      request: { pathname: '/test/2' },
    });
    const tapeFile3 = mockTapeFile({
      request: { pathname: '/test/3' },
    });
    const analyzer = new TapeAnalyzer();

    analyzer.markLoaded(tapeFile);
    analyzer.markOverwritten(tapeFile);
    analyzer.markUsed(tapeFile2);
    analyzer.markNew(tapeFile2);
    analyzer.markDeleted(tapeFile3);

    expect(analyzer.statistics()).toEqual([
      {
        name: 'test.1',
        path: expect.any(String),
        loaded: true,
        overwritten: true,
      },
      {
        name: 'test.2',
        path: expect.any(String),
        used: true,
        new: true,
      },
      {
        name: 'test.3',
        path: expect.any(String),
        deleted: true,
      },
    ]);
  });
});
