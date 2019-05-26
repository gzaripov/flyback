import { IncomingMessage, ServerResponse } from 'http';
import RequestHandler from './request-handler';
import { Request } from './http/http';
import { Options, createContext } from './options';
import TapeStoreManager from './tape-store-manager';

export function createRequest(im: IncomingMessage, body: Buffer): Request {
  const { url, method, headers } = im;

  if (!url || !method) {
    throw new Error(`Invalid incoming message ${im}`);
  }

  const requestHeaders = Object.keys(headers).reduce((acc, header) => {
    const headerValue = headers[header];

    if (Array.isArray(headerValue)) {
      return {
        ...acc,
        [header]: headerValue,
      };
    }

    return {
      ...acc,
      [header]: [headerValue],
    };
  }, {});

  return {
    url,
    method,
    headers: requestHeaders,
    body,
  };
}

export const createTalkbackMiddleware = (
  options: Options,
  tapeStoreManager = new TapeStoreManager(options),
) => {
  const context = createContext(options);

  return (req: IncomingMessage, res: ServerResponse) => {
    const reqBodyChunks: Buffer[] = [];

    req
      .on('data', (chunk) => {
        reqBodyChunks.push(chunk);
      })
      .on('end', async () => {
        try {
          const request = createRequest(req, Buffer.concat(reqBodyChunks));

          const requestHandler = new RequestHandler(context, tapeStoreManager);
          const fRes = await requestHandler.handle(request);

          res.writeHead(fRes.status, fRes.headers);
          res.end(fRes.body);
        } catch (error) {
          context.logger.error('Error handling request');
          context.logger.error(error);
          res.statusCode = 500;
          res.end();
        }
      });
  };
};
