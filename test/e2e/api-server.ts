import http, { IncomingMessage, ServerResponse, Server } from 'http';
import findFreePort from 'find-free-port-sync';
import { urlToListenOptions } from '../../src/utils/url';

function defaultHandler(req: IncomingMessage, requestBody: Buffer, res: ServerResponse) {
  switch (req.url) {
    case '/test/1': {
      const bodyAsString = requestBody.toString();

      const headers = {
        'content-type': 'application/json',
      };

      res.writeHead(200, headers);

      let body = null;

      if (bodyAsString) {
        body = JSON.parse(bodyAsString);
      }

      const pingHeader = req.headers['x-flyback-ping'];

      if (pingHeader) {
        body = pingHeader;
      }

      res.end(JSON.stringify({ ok: true, body }));

      return;
    }
    case '/test/2': {
      res.writeHead(200, {});
      const bodyAsJson = JSON.parse(requestBody.toString());

      res.end(JSON.stringify({ ok: true, body: bodyAsJson }));

      return;
    }
    case '/test/3':
    case '/test/3/500': {
      res.writeHead(500);
      res.end();

      return;
    }
    case '/test/head': {
      res.writeHead(200);
      res.end();

      return;
    }
    case '/test/redirect/1': {
      res.writeHead(302, {
        Location: '/test/1',
      });
      res.end();

      return;
    }
    default: {
      res.writeHead(404);
      res.end();

      return;
    }
  }
}

type Handler = (request: IncomingMessage, response: ServerResponse) => void;

export class ApiServer {
  private readonly server: Server;
  private nextHanlder: Handler;

  constructor() {
    this.server = this.createServer();
  }

  public handleNextRequest(handler: Handler) {
    this.nextHanlder = handler;
  }

  public listen(url: string) {
    this.server.listen(urlToListenOptions(url));
  }

  public close() {
    this.nextHanlder = null;
    this.server.close();
  }

  private createServer() {
    return http.createServer(this.handleRequest.bind(this));
  }

  private handleRequest(request: IncomingMessage, response: ServerResponse) {
    const requestBodyChunks = [];

    request
      .on('error', console.error)
      .on('data', (chunk) => {
        requestBodyChunks.push(chunk);
      })
      .on('end', () => {
        const body = Buffer.concat(requestBodyChunks);

        if (this.nextHanlder) {
          this.nextHanlder(request, response);
          this.nextHanlder = null;

          return;
        }

        defaultHandler(request, body, response);
      });
  }
}

export const apiServer = new ApiServer();
export const apiPort = findFreePort({ start: 8000, end: 8999 });
export const apiUrl = `http://localhost:${apiPort}`;

beforeAll(async () => {
  apiServer.listen(apiUrl);
});

afterAll(() => {
  apiServer.close();
});
