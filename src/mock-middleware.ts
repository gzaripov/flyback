import url from 'url';
import { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from 'http';

type HttpRequest = IncomingMessage;
type HttpResponse = ServerResponse;
type Middleware = (
  request: HttpRequest,
  response: HttpResponse,
  next: (error?: Error) => void,
) => void;

export type PathMatcher = string | RegExp;
export type Config = {
  path: PathMatcher | PathMatcher[];
  headers?: OutgoingHttpHeaders;
  data?: string | Buffer | Object;
  status?: number;
};
export type MockMiddleware = (config: Config) => Middleware;

export const mockMiddleware: MockMiddleware = (config) => {
  const matchers = Array.isArray(config.path) ? config.path : [config.path];

  return async (request, response, nextFn) => {
    try {
      const path = url.parse(request.url!).path || '';

      const matched = matchers.some((matcher) => {
        if (typeof matcher === 'string') {
          return matcher === path;
        }

        return matcher.test(path);
      });

      if (!matched) {
        nextFn();

        return;
      }

      response.writeHead(config.status || 200, config.headers);

      if (typeof config.data === 'string' || config.data instanceof Buffer) {
        response.end(config.data);
      } else if (typeof config.data == 'object') {
        response.end(JSON.stringify(config.data));
      } else {
        response.end();
      }
    } catch (error) {
      nextFn(error);
    }
  };
};
