import https from 'https';
import Logger from '../../src/logger';
import { Context, Options, RecordModes } from '../../src/context';
import { flybackFetch, tapesPath } from './flyback-server';
import { RequestJson } from '../../src/http/request';
import TapeAnalyzer from '../../src/tape-analyzer';

describe('flyback', () => {
  it('works with dynamic folder', async () => {
    const url = '/test/3';

    const recordMode = (request) => {
      if (!request.headers['x-tape-path']) {
        return RecordModes.PROXY;
      }

      return RecordModes.DISABLED;
    };

    const tapePathGenerator = jest.fn(
      (request: RequestJson) => request.headers['x-tape-path'] as string,
    );

    const flybackOpts: Partial<Options> = {
      recordMode,
      ignoreAllHeaders: true,
      tapePathGenerator,
      // we add default tapesPath in flybackFetch
      tapesPath: undefined,
    };

    const responseWithTapePath = await flybackFetch(
      url,
      {
        method: 'GET',
        headers: { 'x-tape-path': tapesPath },
      },
      flybackOpts,
    );

    expect(tapePathGenerator).toHaveBeenCalled();
    expect(responseWithTapePath.status).toEqual(200);

    tapePathGenerator.mockClear();

    const responseWithoutTapePath = await flybackFetch(
      url,
      {
        method: 'GET',
      },
      flybackOpts,
    );

    expect(tapePathGenerator).not.toHaveBeenCalled();
    expect(responseWithoutTapePath.status).toEqual(500);
  });

  describe('error handling', () => {
    it('returns a 500 if anything goes wrong', async () => {
      const logger = new Logger({} as Context);
      const loggerSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
      const error = new Error('Test error');

      const response = await flybackFetch(
        '/test/head',
        {},
        {
          recordMode: 'NEW',
          tapeDecorator: () => {
            throw error;
          },
          logger,
        },
      );

      expect(loggerSpy).toHaveBeenCalledWith(error);
      expect(response.status).toBe(500);
    });
  });

  describe('summary printing', () => {
    it('prints the summary when enabled', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => 0);

      await flybackFetch('/test/pretty', {}, { summary: true });

      expect(spy).toBeCalledWith(expect.stringContaining('Flyback Summary'));
    });

    it("doesn't print the summary when disabled", async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => 0);

      await flybackFetch('/test/pretty', {}, { summary: false });

      expect(spy).not.toBeCalled();
    });
  });

  describe('tape usage information', () => {
    it('should indicate that a tape has been used after usage', async () => {
      const analyzer = new TapeAnalyzer();

      const res = await flybackFetch(
        '/test/head',
        {},
        {
          recordMode: 'NEW',
        },
        {
          analyzer,
        },
      );

      expect(res.status).toEqual(200);

      const [stat] = analyzer.statistics().filter(({ name }) => name === 'test.head');

      expect(stat.new).toBe(true);
      expect(stat.used).toBe(true);
    });
  });

  describe('https', () => {
    it('should be able to run a https server', async () => {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      const response = await flybackFetch(
        '/test/3',
        { agent },
        {
          recordMode: 'DISABLED',
          https: {
            keyPath: './test/e2e/cert/localhost.key',
            certPath: './test/e2e/cert/localhost.crt',
          },
        },
      );

      expect(response.status).toEqual(200);
    });
  });
});
