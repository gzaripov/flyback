import RequestHandler from '../src/request-handler';
import Tape from '../src/tape';
import { Options, prepareOptions } from '../src/options';
import TapeStoreManager from '../src/tape-store-manager';

let tapeStoreManager;
let reqHandler;
let opts;
let savedTape;
let anotherRes;

const rawTape = {
  meta: {
    createdAt: new Date(),
    reqHumanReadable: true,
    resHumanReadable: false,
  },
  req: {
    url: '/foo/bar/1?real=3',
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-ignored': '1',
    },
    body: 'ABC',
  },
  res: {
    status: 200,
    headers: {
      accept: ['application/json'],
      'x-ignored': ['2'],
    },
    body: Buffer.from('Hello').toString('base64'),
  },
};

function prepareForExternalRequest() {
  const fakeMakeRealRequest = jest.fn();

  fakeMakeRealRequest.mockReturnValue(anotherRes);
  jest.spyOn(reqHandler, 'makeRealRequest').mockImplementation(fakeMakeRealRequest);
  jest.spyOn(tapeStoreManager.getTapeStore(), 'save');
}

describe('RequestHandler', () => {
  beforeEach(() => {
    opts = prepareOptions({ debug: false, record: 'NEW' } as Options);
    tapeStoreManager = new TapeStoreManager(opts);
    reqHandler = new RequestHandler(tapeStoreManager, opts);

    savedTape = Tape.fromJSON(rawTape, opts);
    anotherRes = {
      ...savedTape.res,
      body: Buffer.from('Foobar'),
    };
  });

  describe('#handle', () => {
    describe("when request opt is 'NEW'", () => {
      describe('when the request matches a tape', () => {
        beforeEach(() => {
          tapeStoreManager.getTapeStore().tapes = [savedTape];
        });

        it('returns the matched tape response', async () => {
          const resObj = await reqHandler.handle(savedTape.req);

          expect(resObj.status).toEqual(200);
          expect(resObj.body).toEqual(Buffer.from('Hello'));
        });

        describe("when there's a responseDecorator", () => {
          beforeEach(() => {
            opts.responseDecorator = (tape, req) => {
              tape.res.body = req.body;

              return tape;
            };
          });

          it('returns the decorated response', async () => {
            const resObj = await reqHandler.handle(savedTape.req);

            expect(resObj.status).toEqual(200);
            expect(resObj.body).toEqual(Buffer.from('ABC'));
            expect(savedTape.res.body).toEqual(Buffer.from('Hello'));
          });

          it("doesn't add a content-length header if it isn't present in the original response", async () => {
            const resObj = await reqHandler.handle(savedTape.req);

            expect(resObj.headers['content-length']).toBe(undefined);
          });

          it('updates the content-length header if it is present in the original response', async () => {
            savedTape.res.headers['content-length'] = [999];

            const resObj = await reqHandler.handle(savedTape.req);

            expect(resObj.headers['content-length']).toEqual(3);
          });
        });
      });

      describe("when the request doesn't match a tape", () => {
        beforeEach(() => {
          prepareForExternalRequest();
        });

        it('makes the real request and returns the response, saving the tape', async () => {
          const resObj = await reqHandler.handle(savedTape.req);

          expect(resObj.status).toEqual(200);
          expect(resObj.body).toEqual(Buffer.from('Foobar'));

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });

        describe("when there's a responseDecorator", () => {
          beforeEach(() => {
            opts.responseDecorator = (tape, req) => {
              tape.res.body = req.body;

              return tape;
            };
          });

          it('returns the decorated response', async () => {
            const resObj = await reqHandler.handle(savedTape.req);

            expect(resObj.status).toEqual(200);
            expect(resObj.body).toEqual(Buffer.from('ABC'));
            expect(savedTape.res.body).toEqual(Buffer.from('Hello'));
          });
        });
      });
    });

    describe("when request opt is 'OVERWRITE'", () => {
      beforeEach(() => {
        opts.record = 'OVERWRITE';

        prepareForExternalRequest();
      });

      describe('when the request matches a tape', () => {
        beforeEach(() => {
          tapeStoreManager.tapes = [savedTape];
        });

        it('makes the real request and returns the response, saving the tape', async () => {
          const resObj = await reqHandler.handle(savedTape.req);

          expect(resObj.status).toEqual(200);
          expect(resObj.body).toEqual(Buffer.from('Foobar'));

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });
      });

      describe("when the request doesn't match a tape", () => {
        it('makes the real request and returns the response, saving the tape', async () => {
          const resObj = await reqHandler.handle(savedTape.req);

          expect(resObj.status).toEqual(200);
          expect(resObj.body).toEqual(Buffer.from('Foobar'));

          expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
        });
      });
    });

    describe("when request opt is 'DISABLED'", () => {
      beforeEach(() => {
        opts.record = 'DISABLED';
      });

      describe('when the request matches a tape', () => {
        beforeEach(() => {
          tapeStoreManager.getTapeStore().tapes = [savedTape];
        });

        it('returns the matched tape response', async () => {
          const resObj = await reqHandler.handle(savedTape.req);

          expect(resObj.status).toEqual(200);
          expect(resObj.body).toEqual(Buffer.from('Hello'));
        });
      });

      describe("when the request doesn't match a tape", () => {
        describe("when fallbackMode is 'NOT_FOUND'", () => {
          beforeEach(() => {
            opts.fallbackMode = 'NOT_FOUND';
          });

          it('returns a 404', async () => {
            const resObj = await reqHandler.handle(savedTape.req);

            expect(resObj.status).toEqual(404);
          });
        });

        describe("when fallbackMode is 'PROXY'", () => {
          beforeEach(() => {
            opts.fallbackMode = 'PROXY';
            prepareForExternalRequest();
          });

          it("makes real request and returns the response but doesn't save it", async () => {
            const resObj = await reqHandler.handle(savedTape.req);

            expect(resObj.status).toEqual(200);
            expect(resObj.body).toEqual(Buffer.from('Foobar'));

            expect(tapeStoreManager.getTapeStore().save).not.toHaveBeenCalled();
          });
        });

        describe('when fallbackMode is a function', () => {
          let fallbackModeToReturn;

          beforeEach(() => {
            opts.fallbackMode = (req) => {
              expect(req).toEqual(savedTape.req);

              return fallbackModeToReturn;
            };
          });

          it('raises an error if the returned mode is not valid', async () => {
            fallbackModeToReturn = 'INVALID';

            try {
              await reqHandler.handle(savedTape.req);
              throw new Error('Exception expected to be thrown');
            } catch (ex) {
              expect(ex).toEqual("INVALID OPTION: fallbackMode has an invalid value of 'INVALID'");
            }
          });

          it('does what the function returns', async () => {
            fallbackModeToReturn = 'NOT_FOUND';

            let resObj = await reqHandler.handle(savedTape.req);

            expect(resObj.status).toEqual(404);

            fallbackModeToReturn = 'PROXY';
            prepareForExternalRequest();

            resObj = await reqHandler.handle(savedTape.req);
            expect(resObj.status).toEqual(200);
          });
        });
      });
    });

    describe('when record is a function', () => {
      let modeToReturn;

      beforeEach(() => {
        opts.record = (req) => {
          expect(req).toEqual(savedTape.req);

          return modeToReturn;
        };
      });

      it('raises an error if the returned mode is not valid', async () => {
        modeToReturn = 'INVALID';

        try {
          await reqHandler.handle(savedTape.req);
          throw new Error('Exception expected to be thrown');
        } catch (ex) {
          expect(ex).toEqual("INVALID OPTION: record has an invalid value of 'INVALID'");
        }
      });

      it('does what the function returns', async () => {
        modeToReturn = 'DISABLED';

        let resObj = await reqHandler.handle(savedTape.req);

        expect(resObj.status).toEqual(404);

        modeToReturn = 'NEW';
        prepareForExternalRequest();

        resObj = await reqHandler.handle(savedTape.req);
        expect(resObj.status).toEqual(200);
        expect(resObj.body).toEqual(Buffer.from('Foobar'));

        expect(tapeStoreManager.getTapeStore().save).toHaveBeenCalled();
      });
    });
  });
});
