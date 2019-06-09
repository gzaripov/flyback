import { IncomingMessage } from 'http';
import { createRequest } from '../../src/create-request';
import { mockContext } from './mocks';

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
    const context = mockContext();

    const request = createRequest(incomingMessage, context);

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
    const context = mockContext();

    expect(() => createRequest(incomingMessage, context)).toThrow(
      new Error(`Invalid incoming message ${incomingMessage}`),
    );
  });
});
