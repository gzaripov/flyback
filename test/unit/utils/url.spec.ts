import { urlToListenOptions } from '../../../src/utils/url';

describe('Url parser', () => {
  it('parses url', () => {
    const { host, port } = urlToListenOptions('http://localhost:8898/');

    expect(host).toEqual('localhost');
    expect(port).toEqual(8898);
  });

  it('takes port from protocol if port not specified', () => {
    const { port: httpPort } = urlToListenOptions('http://localhost');
    const { port: httpsPort } = urlToListenOptions('https://localhost');

    expect(httpPort).toEqual(80);
    expect(httpsPort).toEqual(443);
  });

  it('throws error when cant find port', () => {
    const url = 'git://localhost';

    expect(() => urlToListenOptions(url)).toThrow(`Cant find port in url ${url}`);
  });
});
