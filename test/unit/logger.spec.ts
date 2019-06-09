import Logger from '../../src/logger';
import { mockContext } from './mocks';

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
    it('does nothing when verbose option is not passed', () => {
      const context = mockContext();
      const logger = new Logger(context);

      logger.log('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('writes to log console when verbose is true', () => {
      const context = mockContext({ verbose: true });
      const logger = new Logger(context);

      logger.log('Test');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Test');
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('#debug', () => {
    it('does nothing if debug option is disabled', () => {
      const context = mockContext({ debug: false });
      const logger = new Logger(context);

      logger.debug('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('writes to debug console if debug option is enabled', () => {
      const context = mockContext({ debug: true });
      const logger = new Logger(context);

      logger.debug('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalledWith('Test');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('#error', () => {
    it('writes to error console if silent option is enabled', () => {
      const context = mockContext({ verbose: true });
      const logger = new Logger(context);

      logger.error('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Test');
    });

    it('writes to error console if silent option is disabled', () => {
      const context = mockContext({ verbose: true });
      const logger = new Logger(context);

      logger.error('Test');

      expect(console.log).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Test');
    });
  });
});
