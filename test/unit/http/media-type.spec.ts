import MediaType from '../../../src/http/media-format';
import { Response, Headers } from '../../../src/http';

function createResponse(headers: Headers = {}) {
  return ({ headers } as any) as Response;
}

describe('MediaType', () => {
  describe('#isHumanReadable', () => {
    it("returns true when the content-type is human readable and there's no content-encoding", () => {
      const res = createResponse({
        'content-type': ['application/json'],
      });

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isHumanReadable()).toBe(true);
    });

    it('returns false when content-type is not present', () => {
      const res = createResponse();

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isHumanReadable()).toBe(false);
    });

    it('returns false when the content-type is not human readable', () => {
      const res = createResponse({
        'content-type': ['img/png'],
      });

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isHumanReadable()).toBe(false);
    });

    it('returns true when the content-type is human readable and the content-encoding is identity', () => {
      const res = createResponse({
        'content-encoding': ['identity'],
        'content-type': ['application/json'],
      });

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isHumanReadable()).toBe(true);
    });

    it('returns false when the content-type is human readable and the content-encoding is gzip', () => {
      const res = createResponse({
        'content-encoding': ['gzip'],
        'content-type': ['application/json'],
      });

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isHumanReadable()).toBe(false);
    });
  });

  describe('#isJSON', () => {
    it('retunrs true when content-type is JSON', () => {
      const res = createResponse({
        'content-type': ['application/json'],
      });

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isJSON()).toBe(true);
    });

    it('rerturns false when content-type is not JSON', () => {
      const res = createResponse({
        'content-type': ['text/html'],
      });

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isJSON()).toBe(false);
    });

    it('returns false when content-type is not set', () => {
      const res = createResponse();

      const mediaType = new MediaType(res.headers);

      expect(mediaType.isJSON()).toBe(false);
    });
  });
});
