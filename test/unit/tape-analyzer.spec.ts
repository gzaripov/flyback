import Logger from '../../src/logger';
import TapeAnalyzer from '../../src/tape-analyzer';
import { mockLogger } from './mocks';

describe.skip('Tape Analyzer', () => {
  describe('printStatistics', () => {
    it('prints nothing when there are no new tapes and no unused tapes', () => {
      const logger = mockLogger();
      const tapeAnalyzer = new TapeAnalyzer();

      tapeAnalyzer.printStatistics();

      expect(logger.log).toBeCalledWith(expect.not.stringContaining('New'));
      expect(logger.log).toBeCalledWith(expect.not.stringContaining('Unused'));
    });

    it('prints the path of new tapes', () => {
      const logger = new Logger();
      const tapeAnalyzer = new TapeAnalyzer();

      tapeAnalyzer.printStatistics();

      expect(logger.log).toBeCalledWith(expect.stringContaining('path1'));
      expect(logger.log).toBeCalledWith(expect.not.stringContaining('path2'));
      expect(logger.log).toBeCalledWith(expect.stringContaining('path3'));
    });

    it('prints the path of unused tapes', () => {
      const logger = new Logger();
      const tapeAnalyzer = new TapeAnalyzer();

      tapeAnalyzer.printStatistics();

      expect(logger.log).toBeCalledWith(expect.stringContaining('path1'));
      expect(logger.log).toBeCalledWith(expect.not.stringContaining('path2'));
      expect(logger.log).toBeCalledWith(expect.stringContaining('path3'));
    });
  });
});
