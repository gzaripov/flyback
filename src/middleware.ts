import { IncomingMessage, ServerResponse } from 'http';
import RequestHandler from './request-handler';
import { Options, createContext } from './context';
import TapeStoreManager from './tape-store-manager';
import { createRequest } from './create-request';

export const createFlybackMiddleware = (options: Options) => {
  const context = createContext(options);
  const tapeStoreManager = new TapeStoreManager(options);
  const requestHandler = new RequestHandler(context, tapeStoreManager);

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    nextFn: (error?: any) => void = () => 0,
  ) => {
    try {
      const request = await createRequest(req, context);
      const response = await requestHandler.handle(request);

      response.writeToServerResponse(res);
      nextFn();
    } catch (error) {
      context.logger.error('Error handling request');
      context.logger.error(error);
      res.statusCode = 500;
      res.end(Buffer.from(`Error handling request:\n${error.toString()}`));

      nextFn(error);
    }
  };
};
