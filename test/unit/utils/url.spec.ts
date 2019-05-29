import { parseUrl } from '../../src/utils/url';

describe('Url parser', () => {
  it('parses url', () => {
    const { host, port } = parseUrl('http://localhost:8898/');

    expect(host).toEqual('localhost');
    expect(port).toEqual(8898);
  });

  it('takes port from protocol if port not specified', () => {
    const { port: httpPort } = parseUrl('http://localhost');
    const { port: httpsPort } = parseUrl('https://localhost');

    expect(httpPort).toEqual(80);
    expect(httpsPort).toEqual(443);
  });

  it('throws error when cant find port', () => {
    const url = 'git://localhost';

    expect(() => parseUrl(url)).toThrow(`Cant find port in url ${url}`);
  });
});
