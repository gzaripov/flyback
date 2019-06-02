import { IncomingMessage, ServerResponse } from 'http';
import RequestHandler from './request-handler';
import { Request, Headers } from './http';
import { Options, createContext, Context } from './context';
import TapeStoreManager from './tape-store-manager';
import url from 'url';
import { HeadersJson } from './http/headers';

export async function createRequest(im: IncomingMessage, context: Context): Promise<Request> {
  if (!im.url || !im.method) {
    throw new Error(`Invalid incoming message ${im}`);
  }

  const body = await new Promise<Buffer>((resolve, reject) => {
    const bodyChunks: Buffer[] = [];

    im.on('data', (chunk) => bodyChunks.push(chunk))
      .on('end', () => {
        const body = Buffer.concat(bodyChunks);

        resolve(body);
      })
      .on('error', reject);
  });

  Object.keys(im.headers).forEach((header) => {
    if (im.headers[header] === undefined) {
      im.headers[header] = '';
    }
  });

  return new Request({
    path: url.parse(im.url).path || '/',
    method: im.method,
    headers: new Headers(im.headers as HeadersJson),
    body,
    context,
  });
}

export const createFlybackMiddleware = (
  options: Options,
  tapeStoreManager = new TapeStoreManager(options),
) => {
  const context = createContext(options);
  const requestHandler = new RequestHandler(context, tapeStoreManager);

  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const request = await createRequest(req, context);
      const response = await requestHandler.handle(request);

      response.writeToServerResponse(res);
    } catch (error) {
      context.logger.error('Error handling request');
      context.logger.error(error);
      res.statusCode = 500;
      res.end();
    }
  };
};
