import { Options } from '../src/options';
import Summary from '../src/summary';
import Logger from '../src/logger';
import Tape from '../src/tape';

jest.mock('../src/logger');

function createMockOptions(opts = {}) {
  return ({
    name: 'My Server',
    logger: new Logger(),
    ...opts,
  } as any) as Options;
}

describe('Summary', () => {
  describe('#print', () => {
    it('print the server name', () => {
      const serverName = 'serverName';
      const logger = new Logger();
      const summary = new Summary([], createMockOptions({ name: serverName, logger }));

      summary.print();

      expect(logger.log).toBeCalledWith(expect.stringContaining(serverName));
    });

    it('prints nothing when there are no new tapes and no unused tapes', () => {
      const logger = new Logger();
      const summary = new Summary([], createMockOptions({ logger }));

      summary.print();

      expect(logger.log).toBeCalledWith(expect.not.stringContaining('New'));
      expect(logger.log).toBeCalledWith(expect.not.stringContaining('Unused'));
    });

    it('prints the path of new tapes', () => {
      const logger = new Logger();
      const summary = new Summary(
        [
          { new: true, used: true, path: 'path1' },
          { used: true, path: 'path2' },
          { new: true, used: true, path: 'path3' },
        ] as Tape[],
        createMockOptions({ logger }),
      );

      summary.print();

      expect(logger.log).toBeCalledWith(expect.stringContaining('path1'));
      expect(logger.log).toBeCalledWith(expect.not.stringContaining('path2'));
      expect(logger.log).toBeCalledWith(expect.stringContaining('path3'));
    });

    it('prints the path of unused tapes', () => {
      const logger = new Logger();
      const summary = new Summary(
        [{ path: 'path1' }, { used: true, path: 'path2' }, { path: 'path3' }] as Tape[],
        createMockOptions({ logger }),
      );

      summary.print();

      expect(logger.log).toBeCalledWith(expect.stringContaining('path1'));
      expect(logger.log).toBeCalledWith(expect.not.stringContaining('path2'));
      expect(logger.log).toBeCalledWith(expect.stringContaining('path3'));
    });
  });
});
