import { createContext } from '../../src/context';

describe('Options', () => {
  it('merges user options and default options', () => {
    const opts = createContext({ proxyUrl: 'https://proxy-url.test', verbose: true });

    expect(opts.verbose).toEqual(true);
    expect(opts.debug).toEqual(false);
  });

  describe('options validation', () => {
    describe('#record', () => {
      it('throws an error when record is not a valid value', () => {
        expect(() => createContext({ recordMode: 'invalid' } as any)).toThrow(
          "INVALID OPTION: record has an invalid value of 'invalid'",
        );
      });
    });

    describe('#fallbackMode', () => {
      it('throws an error when fallbackMode is not a valid value', () => {
        expect(() => createContext({ fallbackMode: 'invalid' } as any)).toThrow(
          "INVALID OPTION: fallbackMode has an invalid value of 'invalid'",
        );
      });
    });
  });
});
