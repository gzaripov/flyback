import Logger from '../../src/logger';
import { Context } from '../../src/options';

describe('Logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('can be created without params', () => {
    expect(() => new Logger()).not.toThrowError();
  });

  describe('#log', () => {
    it('does nothing if silent option is enabled', () => {
      const logger = new Logger({ silent: true } as Context);

      logger.log('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('writes to log console if silent option is disabled', () => {
      const logger = new Logger({ silent: false } as Context);

      logger.log('Test');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Test');
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('#debug', () => {
    it('does nothing if debug option is disabled', () => {
      const logger = new Logger({ debug: false } as Context);

      logger.debug('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('writes to debug console if debug option is enabled', () => {
      const logger = new Logger({ debug: true } as Context);

      logger.debug('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalledWith('Test');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('#error', () => {
    it('writes to error console if silent option is enabled', () => {
      const logger = new Logger({ silent: true } as Context);

      logger.error('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Test');
    });

    it('writes to error console if silent option is disabled', () => {
      const logger = new Logger({ silent: false } as Context);

      logger.error('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Test');
    });
  });
});
