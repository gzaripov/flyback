import RequestHandler from '../../src/request-handler';
import Tape from '../../src/tape';
import { Context, RecordModes, FallbackModes, RecordMode } from '../../src/context';
import TapeStoreManager from '../../src/tape-store-manager';
import { mockContext, mockRequest, mockTape, mockResponse } from './mocks';
import Response from '../../src/http/response';
import TapeStore from '../../src/tape-store';

function mockTapeStore(tapes: Tape[] = []): TapeStore {
  return ({
    load: jest.fn(),
    loadTapesAtDir: jest.fn(),
    getAllTapes: jest.fn(() => tapes),
    find: jest.fn(() => tapes[0]),
    save: jest.fn(),
    delete: jest.fn(),
    hasPath: jest.fn(),
  } as unknown) as TapeStore;
}

function mockTapeStoreManager(tapes: Tape[] = []): TapeStoreManager {
  const tapeStore = mockTapeStore(tapes);

  return ({
    getTapeStore: jest.fn(() => tapeStore),
    findTapeStore: jest.fn(() => tapeStore),
    getAllTapes: jest.fn(() => tapeStore.getAllTapes()),
  } as unknown) as TapeStoreManager;
}

function mockRequestHandler(
  opts: Partial<Context>,
  {
    tapeStoreManager = mockTapeStoreManager(),
    makeRealRequest = () => null,
  }: {
    tapeStoreManager?: TapeStoreManager;
    makeRealRequest?: () => Response | Promise<Response>;
  } = {},
) {
  const requestHandler = new RequestHandler(mockContext(opts), tapeStoreManager);

  if (makeRealRequest) {
    jest
      .spyOn(requestHandler, 'makeRealRequest')
      .mockImplementation(jest.fn(() => Promise.resolve(makeRealRequest())));
  }

  return requestHandler;
}

describe('RequestHandler', () => {
  describe('#handle', () => {
    describe("when recordMode is 'NEW'", () => {
      describe('when the request matches a tape', () => {
        it('returns the matched tape response', async () => {
          const tapeStoreManager = mockTapeStoreManager([mockTape()]);
          const response = await mockRequestHandler(mockContext(), { tapeStoreManager }).handle(
            mockRequest(),
          );

          const responseJson = response.toJson();

          expect(responseJson.status).toEqual(200);
          expect(responseJson.body).toEqual('Hello');
        });

        describe("when there's a tapeDecorator", () => {
          const tapeDecorator = (tape) => {
            tape.response.body = tape.request.body;

            return tape;
          };

          it('returns the decorated response', async () => {
            const context = mockContext({
              tapeDecorator,
            });
            const tapeStoreManager = mockTapeStoreManager([mockTape({ context })]);

            const response = await mockRequestHandler(context, { tapeStoreManager }).handle(
              mockRequest({ context }),
            );

            const reponseJson = response.toJson();

            expect(reponseJson.status).toEqual(200);
            expect(reponseJson.body).toEqual('ABC');
          });
        });
      });

      describe("when the request doesn't match a tape", () => {
        it('makes the real request and returns the response, saving the tape', async () => {
          const tapeStoreManager = mockTapeStoreManager();
          const requestHandler = mockRequestHandler(mockContext(), {
            tapeStoreManager,
            makeRealRequest: () =>
              mockResponse({
                body: 'Foobar',
              }),
          });

          const response = await requestHandler.handle(mockRequest());
          const responseJson = response.toJson();

          expect(responseJson.status).toEqual(200);
          expect(responseJson.body).toEqual('Foobar');

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });

        it("when there's a tapeDecorator returns the decorated response", async () => {
          const tapeDecorator = (tape) => {
            tape.response.body = tape.request.body;

            return tape;
          };

          const context = mockContext({ tapeDecorator });

          const requestHandler = mockRequestHandler(context, {
            makeRealRequest: () =>
              mockResponse({
                body: 'Foobar',
              }),
          });

          const request = mockRequest({ context });
          const response = await requestHandler.handle(request);

          const responseJson = response.toJson();

          expect(responseJson.status).toEqual(200);
          expect(responseJson.body).toEqual('ABC');
        });
      });
    });

    describe("when recordMode is 'OVERWRITE'", () => {
      const context = mockContext({
        proxyUrl: 'https://nowhere.com',
        recordMode: RecordModes.OVERWRITE,
      });

      describe('when the request matches a tape', () => {
        it('makes the real request and returns the response, saving the tape', async () => {
          const tapeStoreManager = mockTapeStoreManager([mockTape()]);
          const requestHandler = mockRequestHandler(context, {
            tapeStoreManager,
            // dont mock real request as we will mock request.send
            makeRealRequest: null,
          });

          const request = mockRequest({ context });

          request.send = jest.fn(() =>
            Promise.resolve(
              mockResponse({
                body: 'Foobar',
              }),
            ),
          );

          const response = await requestHandler.handle(request);

          const responseJson = response.toJson();

          expect(responseJson.status).toEqual(200);
          expect(responseJson.body).toEqual('Foobar');
          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });
      });

      describe("when the request doesn't match a tape", () => {
        it('makes the real request and returns the response, saving the tape', async () => {
          const tapeStoreManager = mockTapeStoreManager();
          const requestHandler = mockRequestHandler(context, {
            tapeStoreManager,
            makeRealRequest: () =>
              mockResponse({
                body: 'Foobar',
              }),
          });

          const request = mockRequest({ context });
          const response = await requestHandler.handle(request);

          const responseJson = response.toJson();

          expect(responseJson.status).toEqual(200);
          expect(responseJson.body).toEqual('Foobar');

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });
      });
    });

    describe("when recordMode is 'DISABLED'", () => {
      const context = mockContext({
        recordMode: RecordModes.DISABLED,
      });

      describe('when the request matches a tape', () => {
        it('returns the matched tape response', async () => {
          const tapeStoreManager = mockTapeStoreManager([mockTape()]);
          const request = mockRequest();
          const response = await mockRequestHandler(context, { tapeStoreManager }).handle(request);

          const responseJson = response.toJson();

          expect(responseJson.status).toEqual(200);
          expect(responseJson.body).toEqual('Hello');
        });
      });

      describe("when the request doesn't match a tape", () => {
        describe("when fallbackMode is 'NOT_FOUND'", () => {
          beforeEach(() => {
            context.fallbackMode = 'NOT_FOUND';
          });

          it('returns a 404', async () => {
            const tapeStoreManager = mockTapeStoreManager();
            const requestHandler = mockRequestHandler(context, {
              tapeStoreManager,
              makeRealRequest: () =>
                mockResponse({
                  body: 'Foobar',
                }),
            });

            const request = mockRequest();
            const response = await requestHandler.handle(request);
            const responseJson = response.toJson();

            expect(responseJson.status).toEqual(404);
          });
        });

        describe("when fallbackMode is 'PROXY'", () => {
          const context = mockContext({
            recordMode: RecordModes.DISABLED,
            fallbackMode: FallbackModes.PROXY,
          });

          it("makes real request and returns the response but doesn't save it", async () => {
            const tapeStoreManager = mockTapeStoreManager();
            const requestHandler = mockRequestHandler(context, {
              tapeStoreManager,
              makeRealRequest: () =>
                mockResponse({
                  body: 'Foobar',
                }),
            });

            const request = mockRequest();
            const response = await requestHandler.handle(request);

            const responseJson = response.toJson();

            expect(responseJson.status).toEqual(200);
            expect(responseJson.body).toEqual('Foobar');

            expect(tapeStoreManager.getTapeStore().save).not.toHaveBeenCalled();
          });
        });

        describe('when fallbackMode is a function', () => {
          let fallbackModeToReturn;

          beforeEach(() => {
            context.fallbackMode = (request) => {
              expect(request).toEqual(mockRequest().toJson());

              return fallbackModeToReturn;
            };
          });

          it('raises an error if the returned mode is not valid', async () => {
            fallbackModeToReturn = 'INVALID';
            const tapeStoreManager = mockTapeStoreManager();
            const requestHandler = mockRequestHandler(context, {
              tapeStoreManager,
              makeRealRequest: () =>
                mockResponse({
                  body: 'Foobar',
                }),
            });

            try {
              await requestHandler.handle(mockRequest());
              throw new Error('Exception expected to be thrown');
            } catch (ex) {
              expect(ex).toEqual(
                new Error("INVALID OPTION: fallbackMode has an invalid value of 'INVALID'"),
              );
            }
          });

          it('does what the function returns', async () => {
            fallbackModeToReturn = 'NOT_FOUND';
            const tapeStoreManager = mockTapeStoreManager();
            const requestHandler = mockRequestHandler(context, {
              tapeStoreManager,
              makeRealRequest: () =>
                mockResponse({
                  body: 'Foobar',
                }),
            });

            let response = await requestHandler.handle(mockRequest());
            let responseJson = response.toJson();

            expect(responseJson.status).toEqual(404);

            fallbackModeToReturn = 'PROXY';

            response = await requestHandler.handle(mockRequest());
            responseJson = response.toJson();

            expect(responseJson.status).toEqual(200);
          });
        });
      });
    });

    describe("when recordMode is 'PROXY'", () => {
      const context = mockContext({
        recordMode: RecordModes.PROXY,
      });

      it('proxies request', async () => {
        const tapeStoreManager = mockTapeStoreManager();
        const requestHandler = mockRequestHandler(context, {
          tapeStoreManager,
          makeRealRequest: () =>
            mockResponse({
              body: 'Foobar',
            }),
        });

        const response = await requestHandler.handle(mockRequest({ context }));
        const responseJson = response.toJson();

        expect(responseJson.status).toEqual(200);
        expect(responseJson.body).toEqual('Foobar');

        expect(tapeStoreManager.getTapeStore().save).not.toHaveBeenCalled();
      });
    });

    describe('when recordMode is a function', () => {
      const getContextMock = (modeToReturn: RecordMode) =>
        mockContext({
          recordMode: (request) => {
            expect(request).toEqual(mockRequest().toJson());

            return modeToReturn;
          },
        });

      it('raises an error if the returned mode is not valid', async () => {
        const context = getContextMock('INVALID' as RecordMode);

        try {
          await mockRequestHandler(context).handle(mockRequest({ context }));
          throw new Error('Exception expected to be thrown');
        } catch (ex) {
          expect(ex).toEqual(new Error("INVALID OPTION: record has an invalid value of 'INVALID'"));
        }
      });

      it('does not cache what the function returns', async () => {
        const context = getContextMock(RecordModes.DISABLED);

        const tapeStoreManager = mockTapeStoreManager();

        let response = await mockRequestHandler(context, {
          tapeStoreManager,
          makeRealRequest: () =>
            mockResponse({
              body: 'Foobar',
            }),
        }).handle(mockRequest({ context }));

        expect(response.toJson().status).toEqual(404);

        const newContext = getContextMock(RecordModes.NEW);

        response = await mockRequestHandler(newContext, {
          tapeStoreManager,
          makeRealRequest: () =>
            mockResponse({
              body: 'Foobar',
            }),
        }).handle(mockRequest({ context: newContext }));

        const responseJson = response.toJson();

        expect(responseJson.status).toEqual(200);
        expect(responseJson.body).toEqual('Foobar');

        expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
      });
    });
  });

  it('create requestHandler instance without second parameter', () => {
    expect(() => new RequestHandler(mockContext())).not.toThrowError();
  });
});
