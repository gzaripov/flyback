import RequestHandler from '../src/request-handler';
import { createTapeFromJSON, SerializedTape } from '../src/tape';
import { Options, prepareOptions } from '../src/options';
import TapeStoreManager from '../src/tape-store-manager';

let opts: Options;

const helloBase64 = Buffer.from('Hello').toString('base64');

function getMockTape() {
  const rawTape: SerializedTape = {
    meta: {
      endpoint: 'test-proxy.com',
      createdAt: new Date(),
    },
    request: {
      url: '/foo/bar/1?real=3',
      method: 'GET',
      headers: {
        accept: ['application/json'],
        'x-ignored': ['1'],
      },
      body: 'ABC',
    },
    response: {
      status: 200,
      headers: {
        accept: ['application/json'],
        'x-ignored': ['2'],
      },
      body: helloBase64,
    },
  };

  return createTapeFromJSON(rawTape);
}

function getMockTapeStoreManager(tapes = []) {
  const tapeStoreManager = new TapeStoreManager(opts);

  tapeStoreManager.getTapeStore().tapes = tapes;

  jest.spyOn(tapeStoreManager.getTapeStore(), 'save');

  return tapeStoreManager;
}

function getMockRequestHandler(
  opts: Options,
  { tapeStoreManager = getMockTapeStoreManager(), makeRealRequest = () => null } = {},
) {
  const requestHandler = new RequestHandler(tapeStoreManager, opts);

  jest.spyOn(requestHandler, 'makeRealRequest').mockImplementation(jest.fn(makeRealRequest));

  return requestHandler;
}

describe('RequestHandler', () => {
  beforeEach(() => {
    opts = prepareOptions({
      debug: false,
      record: 'NEW',
      tapesPath: `${__dirname}/tapes`,
    } as Options);
  });

  describe('#handle', () => {
    describe("when request opt is 'NEW'", () => {
      describe('when the request matches a tape', () => {
        it('returns the matched tape response', async () => {
          const tapeStoreManager = getMockTapeStoreManager([getMockTape()]);
          const response = await getMockRequestHandler(opts, { tapeStoreManager }).handle(
            getMockTape().request,
          );

          expect(response.status).toEqual(200);
          expect(response.body).toEqual(Buffer.from(helloBase64));
        });

        describe("when there's a responseDecorator", () => {
          beforeEach(() => {
            opts.tapeDecorator = (tape) => {
              tape.response.body = tape.request.body;

              return tape;
            };
          });

          it('returns the decorated response', async () => {
            const response = await getMockRequestHandler(opts).handle(getMockTape().request);

            expect(response.status).toEqual(200);
            expect(response.body).toEqual(Buffer.from('ABC'));
            expect(getMockTape().response.body).toEqual(Buffer.from(helloBase64));
          });

          it("doesn't add a content-length header if it isn't present in the original response", async () => {
            const tapeStoreManager = getMockTapeStoreManager([getMockTape()]);
            const response = await getMockRequestHandler(opts, { tapeStoreManager }).handle(
              getMockTape().request,
            );

            expect(response.headers['content-length']).toBe(undefined);
          });
        });
      });

      describe("when the request doesn't match a tape", () => {
        it('makes the real request and returns the response, saving the tape', async () => {
          const tapeStoreManager = getMockTapeStoreManager();
          const requestHandler = getMockRequestHandler(opts, {
            tapeStoreManager,
            makeRealRequest: () => ({
              ...getMockTape().response,
              body: Buffer.from('Foobar'),
            }),
          });

          const response = await requestHandler.handle(getMockTape().request);

          console.log(response.body.toString());

          expect(response.status).toEqual(200);
          expect(response.body).toEqual(Buffer.from('Foobar'));

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });

        describe("when there's a responseDecorator", () => {
          beforeEach(() => {
            opts.tapeDecorator = (tape) => {
              tape.response.body = tape.request.body;

              return tape;
            };
          });

          it('returns the decorated response', async () => {
            const requestHandler = getMockRequestHandler(opts, {
              makeRealRequest: () => ({
                ...getMockTape().response,
                body: Buffer.from('Foobar'),
              }),
            });

            const response = await requestHandler.handle(getMockTape().request);

            expect(response.status).toEqual(200);
            expect(response.body).toEqual(Buffer.from('ABC'));
            expect(getMockTape().response.body).toEqual(Buffer.from(helloBase64));
          });
        });
      });
    });

    describe("when request opt is 'OVERWRITE'", () => {
      beforeEach(() => {
        opts.record = 'OVERWRITE';
      });

      describe('when the request matches a tape', () => {
        it('makes the real request and returns the response, saving the tape', async () => {
          const tapeStoreManager = getMockTapeStoreManager();
          const requestHandler = getMockRequestHandler(opts, {
            tapeStoreManager,
            makeRealRequest: () => ({
              ...getMockTape().response,
              body: Buffer.from('Foobar'),
            }),
          });

          const response = await requestHandler.handle(getMockTape().request);

          expect(response.status).toEqual(200);
          expect(response.body).toEqual(Buffer.from('Foobar'));

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });
      });

      describe("when the request doesn't match a tape", () => {
        it('makes the real request and returns the response, saving the tape', async () => {
          const tapeStoreManager = getMockTapeStoreManager();
          const requestHandler = getMockRequestHandler(opts, {
            tapeStoreManager,
            makeRealRequest: () => ({
              ...getMockTape().response,
              body: Buffer.from('Foobar'),
            }),
          });

          const response = await requestHandler.handle(getMockTape().request);

          expect(response.status).toEqual(200);
          expect(response.body).toEqual(Buffer.from('Foobar'));

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });
      });
    });

    describe("when request opt is 'DISABLED'", () => {
      beforeEach(() => {
        opts.record = 'DISABLED';
      });

      describe('when the request matches a tape', () => {
        it('returns the matched tape response', async () => {
          const tapeStoreManager = getMockTapeStoreManager([getMockTape()]);
          const response = await getMockRequestHandler(opts, { tapeStoreManager }).handle(
            getMockTape().request,
          );

          expect(response.status).toEqual(200);
          expect(response.body).toEqual(Buffer.from(helloBase64));
        });
      });

      describe("when the request doesn't match a tape", () => {
        describe("when fallbackMode is 'NOT_FOUND'", () => {
          beforeEach(() => {
            opts.fallbackMode = 'NOT_FOUND';
          });

          it('returns a 404', async () => {
            const tapeStoreManager = getMockTapeStoreManager();
            const requestHandler = getMockRequestHandler(opts, {
              tapeStoreManager,
              makeRealRequest: () => ({
                ...getMockTape().response,
                body: Buffer.from('Foobar'),
              }),
            });

            const resObj = await requestHandler.handle(getMockTape().request);

            expect(resObj.status).toEqual(404);
          });
        });

        describe("when fallbackMode is 'PROXY'", () => {
          beforeEach(() => {
            opts.fallbackMode = 'PROXY';
          });

          it("makes real request and returns the response but doesn't save it", async () => {
            const tapeStoreManager = getMockTapeStoreManager();
            const requestHandler = getMockRequestHandler(opts, {
              tapeStoreManager,
              makeRealRequest: () => ({
                ...getMockTape().response,
                body: Buffer.from('Foobar'),
              }),
            });

            const resObj = await requestHandler.handle(getMockTape().request);

            expect(resObj.status).toEqual(200);
            expect(resObj.body).toEqual(Buffer.from('Foobar'));

            expect(tapeStoreManager.getTapeStore().save).not.toHaveBeenCalled();
          });
        });

        describe('when fallbackMode is a function', () => {
          let fallbackModeToReturn;

          beforeEach(() => {
            opts.fallbackMode = (req) => {
              expect(req).toEqual(getMockTape().request);

              return fallbackModeToReturn;
            };
          });

          it('raises an error if the returned mode is not valid', async () => {
            fallbackModeToReturn = 'INVALID';
            const tapeStoreManager = getMockTapeStoreManager();
            const requestHandler = getMockRequestHandler(opts, {
              tapeStoreManager,
              makeRealRequest: () => ({
                ...getMockTape().response,
                body: Buffer.from('Foobar'),
              }),
            });

            try {
              await requestHandler.handle(getMockTape().request);
              throw new Error('Exception expected to be thrown');
            } catch (ex) {
              expect(ex).toEqual(
                new Error("INVALID OPTION: fallbackMode has an invalid value of 'INVALID'"),
              );
            }
          });

          it('does what the function returns', async () => {
            fallbackModeToReturn = 'NOT_FOUND';
            const tapeStoreManager = getMockTapeStoreManager();
            const requestHandler = getMockRequestHandler(opts, {
              tapeStoreManager,
              makeRealRequest: () => ({
                ...getMockTape().response,
                body: Buffer.from('Foobar'),
              }),
            });

            let resObj = await requestHandler.handle(getMockTape().request);

            expect(resObj.status).toEqual(404);

            fallbackModeToReturn = 'PROXY';

            resObj = await requestHandler.handle(getMockTape().request);
            expect(resObj.status).toEqual(200);
          });
        });
      });
    });

    describe('when record is a function', () => {
      let modeToReturn;

      beforeEach(() => {
        opts.record = (req) => {
          expect(req).toEqual(getMockTape().request);

          return modeToReturn;
        };
      });

      it('raises an error if the returned mode is not valid', async () => {
        modeToReturn = 'INVALID';

        try {
          await getMockRequestHandler(opts).handle(getMockTape().request);
          throw new Error('Exception expected to be thrown');
        } catch (ex) {
          expect(ex).toEqual(new Error("INVALID OPTION: record has an invalid value of 'INVALID'"));
        }
      });

      it('does what the function returns', async () => {
        modeToReturn = 'DISABLED';

        const tapeStoreManager = getMockTapeStoreManager();

        let response = await getMockRequestHandler(opts, {
          tapeStoreManager,
          makeRealRequest: () => ({
            ...getMockTape().response,
            body: Buffer.from('Foobar'),
          }),
        }).handle(getMockTape().request);

        expect(response.status).toEqual(404);

        modeToReturn = 'NEW';

        response = await getMockRequestHandler(opts, {
          tapeStoreManager,
          makeRealRequest: () => ({
            ...getMockTape().response,
            body: Buffer.from('Foobar'),
          }),
        }).handle(getMockTape().request);

        expect(response.status).toEqual(200);
        expect(response.body).toEqual(Buffer.from('Foobar'));

        expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
      });
    });
  });
});
