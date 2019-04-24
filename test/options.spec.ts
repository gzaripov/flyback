import { Options, prepareOptions } from '../src/options';

describe('Options', () => {
  it('merges user options and default options', () => {
    const opts = prepareOptions({ silent: true } as Options);

    expect(opts.silent).toEqual(true);
    expect(opts.debug).toEqual(false);
  });

  it('defaults name to the proxyUrl', () => {
    const proxyUrl = 'https://my-api.com';
    let opts = prepareOptions({ proxyUrl });

    expect(opts.name).toEqual(proxyUrl);

    opts = prepareOptions({ proxyUrl, name: 'My Server' });
    expect(opts.name).toEqual('My Server');
  });

  describe('options validation', () => {
    describe('#record', () => {
      it('throws an error when record is not a valid value', () => {
        expect(() => prepareOptions({ recordMode: 'invalid' } as any)).toThrow(
          "INVALID OPTION: record has an invalid value of 'invalid'",
        );
      });
    });

    describe('#fallbackMode', () => {
      it('throws an error when fallbackMode is not a valid value', () => {
        expect(() => prepareOptions({ fallbackMode: 'invalid' } as any)).toThrow(
          "INVALID OPTION: fallbackMode has an invalid value of 'invalid'",
        );
      });
    });
  });
});
