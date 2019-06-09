import { createContext, RecordMode, FallbackMode } from '../../src/context';

describe('Options', () => {
  it('merges user options and default options', () => {
    const opts = createContext({ proxyUrl: 'https://proxy-url.test', verbose: true });

    expect(opts.verbose).toEqual(true);
    expect(opts.debug).toEqual(false);
  });

  describe('options validation', () => {
    describe('proxyUrl and flybackUrl', () => {
      it('throws error if url does not have protocol or it is not http-like', () => {
        const invalidUrl = 'localhost:8988';
        const error = `${invalidUrl} is not valid, pass url with http or https protocol`;

        expect(() => createContext({ proxyUrl: invalidUrl })).toThrow(error);
        expect(() => createContext({ flybackUrl: invalidUrl })).toThrow(error);
      });

      it("throws error if url's host is empty", () => {
        const invalidUrl = 'http:';
        const error = `${invalidUrl} is not valid, pass url with host`;

        expect(() => createContext({ proxyUrl: invalidUrl })).toThrow(error);
        expect(() => createContext({ flybackUrl: invalidUrl })).toThrow(error);
      });
    });

    describe('recordMode', () => {
      it('throws an error when record is not a valid value', () => {
        expect(() => createContext({ recordMode: 'invalid' as RecordMode })).toThrow(
          "INVALID OPTION: record has an invalid value of 'invalid'",
        );
      });
    });

    describe('fallbackMode', () => {
      it('throws an error when fallbackMode is not a valid value', () => {
        expect(() => createContext({ fallbackMode: 'invalid' as FallbackMode })).toThrow(
          "INVALID OPTION: fallbackMode has an invalid value of 'invalid'",
        );
      });
    });
  });
});
