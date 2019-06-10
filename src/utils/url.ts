import url, { URLSearchParams } from 'url';
import { ListenOptions } from 'net';

export type QueryParamsObject = { [key: string]: string | string[] | undefined };

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

export function queryParamsToObject(query: string): QueryParamsObject {
  const searchParams = new URLSearchParams(query);

  return [...searchParams.entries()].reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

export function objectToQueryParams(object: QueryParamsObject): string {
  return new URLSearchParams(object).toString();
}
