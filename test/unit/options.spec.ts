import { Options, createContext } from '../../src/context';

describe('Options', () => {
  it('merges user options and default options', () => {
    const opts = createContext({ verbose: true } as Options);

    expect(opts.verbose).toEqual(true);
    expect(opts.debug).toEqual(false);
  });

  it('defaults name to the proxyUrl', () => {
    const proxyUrl = 'https://my-api.com';
    let opts = createContext({ proxyUrl });

    expect(opts.name).toEqual(proxyUrl);

    opts = createContext({ proxyUrl, name: 'My Server' });
    expect(opts.name).toEqual('My Server');
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
