import url from 'url';
import Headers, { HeadersJson } from './http/headers';
import { IncomingMessage } from 'http';
import { Context } from './context';
import { Request } from './http';

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
    path: url.parse(im.url).path as string,
    method: im.method,
    headers: new Headers(im.headers as HeadersJson),
    body,
    context,
  });
}
