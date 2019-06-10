import Headers from '../../../src/http/headers';

describe('Headers', () => {
  describe('read', () => {
    it("returns the value when it's an array", () => {
      const headers = {
        'content-type': ['application/json'],
      };
      const value = new Headers(headers).read('content-type');

      expect(value).toEqual('application/json');
    });

    it("returns the value when it's just the value", () => {
      const headers = {
        'content-type': ['application/json'],
      };
      const value = new Headers(headers).read('content-type');

      expect(value).toEqual('application/json');
    });
  });

  describe('write', () => {
    it("writes the value as an array when it's for req", () => {
      const headers = new Headers({});

      headers.write('content-type', 'application/json');
      expect(headers.read('content-type')).toEqual('application/json');
    });

    it("writes the value as an array when it's for res", () => {
      const headers = new Headers({});

      headers.write('content-type', 'application/json');
      expect(headers.read('content-type')).toEqual('application/json');
    });
  });

  describe('delete', () => {
    it('deletes written header', () => {
      const headers = new Headers({});

      headers.write('content-type', 'application/json');
      expect(headers.read('content-type')).toEqual('application/json');

      headers.delete('content-type');

      expect(headers.read('content-type')).toEqual(undefined);
    });
  });

  describe('equality', () => {
    it('equals should compare headers and exclude ignored headers', () => {
      const headers = new Headers({
        'content-type': ['application/json'],
        date: '1998:11:28:12:34:56',
      });

      const otherHeaders = new Headers({
        'content-type': 'application/json',
      });

      expect(headers.equals(otherHeaders, { ignoreHeaders: ['date'] })).toBe(true);
    });

    it('equals should return false for headers with different number of headers', () => {
      const headers = new Headers({
        'header-a': 'a',
      });

      const otherHeaders = new Headers({
        'header-a': 'a',
        'header-b': 'b',
      });

      expect(headers.equals(otherHeaders)).toBe(false);
    });

    it('equals should return false for headers with arrays in value with different length', () => {
      const headers = new Headers({
        values: ['first', 'second', 'third'],
      });

      const otherHeaders = new Headers({
        values: ['first', 'second'],
      });

      const anotherHeaders = new Headers({
        values: ['first'],
      });

      expect(headers.equals(otherHeaders)).toBe(false);
      expect(headers.equals(anotherHeaders)).toBe(false);
    });
  });

  describe('content-type and content-encoding', () => {
    it('returns null when there is not header', () => {
      const headers = new Headers({});

      const contentType = headers.contentType();
      const contentEncoding = headers.contentEncoding();

      expect(contentType).toBe(null);
      expect(contentEncoding).toBe(null);
    });

    it('returns header when there is just value or array', () => {
      const headers = new Headers({
        'content-type': ['application/json'],
        'content-encoding': 'gzip',
      });

      const contentType = headers.contentType();
      const contentEncoding = headers.contentEncoding();

      expect(contentType).toBe('application/json');
      expect(contentEncoding).toBe('gzip');
    });

    it('returns lowecase trimmed strings', () => {
      const headers = new Headers({
        'content-type': [' application/json '],
        'content-encoding': 'GZIP ',
      });

      const contentType = headers.contentType();
      const contentEncoding = headers.contentEncoding();

      expect(contentType).toBe('application/json');
      expect(contentEncoding).toBe('gzip');
    });

    it('returns first value if there are multiple values in header', () => {
      const headers = new Headers({
        'content-type': ['application/json', 'json'],
        'content-encoding': ['gzip', 'identity'],
      });

      const contentType = headers.contentType();
      const contentEncoding = headers.contentEncoding();

      expect(contentType).toBe('application/json');
      expect(contentEncoding).toBe('gzip');
    });
  });

  describe('toJSON', () => {
    it('return json representation of headers', () => {
      const headers = new Headers({
        'client-protocol': ['quic'],
        'accept-ranges': 'bytes',
        expires: 'Mon, 10 Jun 2019 07:09:54 GMT',
      });

      expect(headers.toJSON()).toEqual({
        'client-protocol': 'quic',
        'accept-ranges': 'bytes',
        expires: 'Mon, 10 Jun 2019 07:09:54 GMT',
      });
    });
  });
});
