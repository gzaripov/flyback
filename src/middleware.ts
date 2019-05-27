import { IncomingMessage, ServerResponse } from 'http';
import RequestHandler from './request-handler';
import { Request, Headers } from './http';
import { Options, createContext } from './options';
import TapeStoreManager from './tape-store-manager';
import { URL } from 'url';

export async function createRequest(im: IncomingMessage): Promise<Request> {
  const { url, method, headers } = im;

  if (!url || !method) {
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

  const reqUrl = new URL(url);

  return new Request({
    path: reqUrl.pathname + reqUrl.search,
    method,
    headers: new Headers(headers),
    body,
  });
}

export const createTalkbackMiddleware = (
  options: Options,
  tapeStoreManager = new TapeStoreManager(options),
) => {
  const context = createContext(options);

  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const request = await createRequest(req);
      const requestHandler = new RequestHandler(context, tapeStoreManager);
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
