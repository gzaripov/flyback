import { IncomingMessage } from 'http';
import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'events';
import { createRequest } from '../../src/create-request';
import { mockContext } from './mocks';

describe('createRequest', () => {
  it('creates request from incoming message', async () => {
    const incomingMessage = httpMocks.createRequest<IncomingMessage>({
      url: 'http://create-request.com/create-request',
      method: 'POST',
      headers: {
        accepts: 'application/json',
        cookie: 'fristcookie=one;secondcookie=two',
        empty: undefined,
        'content-type': 'text/plain',
      },
      eventEmitter: EventEmitter,
    });
    const context = mockContext();
    const request = createRequest(incomingMessage, context);

    incomingMessage.emit('data', Buffer.from('ABC'));
    incomingMessage.emit('end');

    const requestJson = (await request).toJson();

    expect(requestJson).toEqual({
      path: '/create-request',
      method: 'POST',
      headers: {
        accepts: 'application/json',
        cookie: 'fristcookie=one;secondcookie=two',
        empty: '',
        'content-type': 'text/plain',
      },
      body: 'ABC',
    });
  });

  it('throws error if url or method are not truthy', async () => {
    const incomingMessage = httpMocks.createRequest<IncomingMessage>({
      url: '',
      method: '',
      headers: {
        accepts: 'application/json',
        cookie: ['fristcookie', 'secondcookie'],
      },
      eventEmitter: EventEmitter,
    } as any) as IncomingMessage;
    const context = mockContext();
    const request = createRequest(incomingMessage, context);

    incomingMessage.emit('end');

    expect(request).rejects.toThrow(new Error(`Invalid incoming message ${incomingMessage}`));
  });
});
