import MediaFormat from '../../../src/http/media-format';
import { Headers } from '../../../src/http';

describe('mediaFormat', () => {
  describe('isHumanReadable', () => {
    it("returns true when the content-type is human readable and there's no content-encoding", () => {
      const headers = new Headers({
        'content-type': 'application/json',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isHumanReadable()).toBe(true);
    });

    it('returns false when content-type is not present', () => {
      const headers = new Headers({});

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isHumanReadable()).toBe(false);
    });

    it('returns false when the content-type is not human readable', () => {
      const headers = new Headers({
        'content-type': 'img/png',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isHumanReadable()).toBe(false);
    });

    it('returns true when the content-type is human readable and the content-encoding is identity', () => {
      const headers = new Headers({
        'content-encoding': 'identity',
        'content-type': 'application/json',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isHumanReadable()).toBe(true);
    });

    it('returns true when the content-type is human readable and the content-encoding is gzip', () => {
      const headers = new Headers({
        'content-encoding': 'gzip',
        'content-type': 'application/json',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isHumanReadable()).toBe(true);
    });

    it('returns false when content is not decodable', () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'content-encoding': 'unkown-encoding',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isHumanReadable()).toBe(false);
    });
  });

  describe('isJson', () => {
    it('retunrs true when content-type is JSON', () => {
      const headers = new Headers({
        'content-type': 'application/json',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isJson()).toBe(true);
    });

    it('rerturns false when content-type is not JSON', () => {
      const headers = new Headers({
        'content-type': 'text/html',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isJson()).toBe(false);
    });

    it('returns false when content-type is not set', () => {
      const headers = new Headers({});

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isJson()).toBe(false);
    });

    it('returns false when content is not decodable', () => {
      const headers = new Headers({
        'content-type': 'application/json',
        'content-encoding': 'unkown-encoding',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isJson()).toBe(false);
    });
  });

  describe('isDecodable', () => {
    it('returns true when there is no content encoding in headers', () => {
      const headers = new Headers({});

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isDecodable()).toBe(true);
    });

    it('returns true when encoding is identity', () => {
      const headers = new Headers({
        'content-encoding': 'identity',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isDecodable()).toBe(true);
    });

    it('returns false when encoding is not supported', () => {
      const headers = new Headers({
        'content-encoding': 'unknown-encoding',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isDecodable()).toBe(false);
    });

    it('returns false when charset is not supported', () => {
      const headers = new Headers({
        'content-encoding': 'gzip',
        'content-type': 'application/json;charset=ascii',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isDecodable()).toBe(false);
    });

    it('returns true when content encoding and charset are supported', () => {
      const headers = new Headers({
        'content-encoding': 'gzip',
        'content-type': 'application/json',
      });

      const mediaFormat = new MediaFormat(headers);

      expect(mediaFormat.isDecodable()).toBe(true);
    });
  });
});
