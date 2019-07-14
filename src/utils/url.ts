import url from 'url';
import { ListenOptions } from 'net';

export function urlToListenOptions(siteUrl: string): ListenOptions {
  const { hostname, port, protocol } = url.parse(siteUrl);

  if (!port) {
    if (protocol === 'http:') {
      return {
        host: hostname,
        port: 80,
      };
    }
    if (protocol === 'https:') {
      return {
        host: hostname,
        port: 443,
      };
    }
    throw new Error(`Cant find port in url ${siteUrl}`);
  }

  return {
    host: hostname,
    port: Number.parseInt(port, 10),
  };
}
