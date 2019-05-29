import { HeadersUtil } from '../../src/utils/headers';

describe('Headers', () => {
  describe('.write', () => {
    it("returns the value when it's an array", () => {
      const headers = {
        'content-type': ['application/json'],
      };
      const value = HeadersUtil.read(headers, 'content-type');

      expect(value).toEqual('application/json');
    });

    it("returns the value when it's just the value", () => {
      const headers = {
        'content-type': ['application/json'],
      };
      const value = HeadersUtil.read(headers, 'content-type');

      expect(value).toEqual('application/json');
    });
  });

  describe('.write', () => {
    it("writes the value as an array when it's for req", () => {
      const headers = {};

      HeadersUtil.write(headers, 'content-type', 'application/json');
      expect(headers['content-type']).toEqual(['application/json']);
    });

    it("writes the value as an array when it's for res", () => {
      const headers = {};

      HeadersUtil.write(headers, 'content-type', 'application/json');
      expect(headers['content-type']).toEqual(['application/json']);
    });
  });
});
