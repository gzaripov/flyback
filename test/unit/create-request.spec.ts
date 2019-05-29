import { createRequest } from '../../src/middleware';
import { IncomingMessage } from 'http';

describe('createRequest', () => {
  it('creates request', () => {
    const incomingMessage = ({
      url: 'http://create-request.com',
      method: 'POST',
      headers: {
        accepts: 'application/json',
        cookie: ['fristcookie', 'secondcookie'],
      },
    } as any) as IncomingMessage;

    const request = createRequest(incomingMessage, Buffer.from('ABC'));

    expect(request).toEqual({
      url: 'http://create-request.com',
      method: 'POST',
      headers: { accepts: ['application/json'], cookie: ['fristcookie', 'secondcookie'] },
      body: Buffer.from('ABC'),
    });
  });

  it('throws error if url or method are not truthy', () => {
    const incomingMessage = ({
      url: '',
      method: '',
      headers: {
        accepts: 'application/json',
        cookie: ['fristcookie', 'secondcookie'],
      },
    } as any) as IncomingMessage;

    expect(() => createRequest(incomingMessage, Buffer.from(''))).toThrow(
      new Error(`Invalid incoming message ${incomingMessage}`),
    );
  });
});
