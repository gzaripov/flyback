import Path from '../../../src/http/path';
import { mockContext } from '../mocks';

describe('Path', () => {
  it('.name returns url pathname', () => {
    const url = '/api/v3/data?testing=true&info=false';
    const ctx = mockContext();

    const path = new Path(url, ctx);

    expect(path.name).toBe('/api/v3/data');
  });

  it('toString() returns normalized passed path', () => {
    const url = 'api/v3/data?testing=true&info=false';
    const ctx = mockContext();

    const path = new Path(url, ctx);

    expect(path.toString()).toBe(`/${url}`);
  });

  describe('equals', () => {
    it('returns true when paths are identical', () => {
      const url = '/api/v3/data?testing=true&info=false';
      const ctx = mockContext();

      const path1 = new Path(url, ctx);
      const path2 = new Path(url, ctx);

      expect(path1.equals(path2)).toBe(true);
    });

    it('returns true when paths without params are identical', () => {
      const url = '/api/v3/data';
      const ctx = mockContext();

      const path1 = new Path(url, ctx);
      const path2 = new Path(url, ctx);

      expect(path1.equals(path2)).toBe(true);
    });

    it('returns false when paths are different', () => {
      const ctx = mockContext();

      const path1 = new Path('/api/v3/data?testing=true&info=false', ctx);
      const path2 = new Path('/api/v2/data?testing=true&info=false', ctx);

      expect(path1.equals(path2)).toBe(false);
    });

    it('returns false when queries are different', () => {
      const ctx = mockContext();

      const path1 = new Path('/api/v3/data?testing=true&info=false', ctx);
      const path2 = new Path('/api/v3/data?testing=true&info=true', ctx);

      expect(path1.equals(path2)).toBe(false);
    });

    it('returns true when queries are different but ignoreAllQueryParams passed', () => {
      const ctx = mockContext({
        ignoreAllQueryParams: true,
      });

      const path1 = new Path('/api/v3/data?testing=false&info=false', ctx);
      const path2 = new Path('/api/v3/data?testing=true&info=true', ctx);

      expect(path1.equals(path2)).toBe(true);
    });

    it('returns true when some query param differs but it is ignored', () => {
      const ctx = mockContext({
        ignoreQueryParams: ['info'],
      });

      const path1 = new Path('/api/v3/data?testing=false&info=false', ctx);
      const path2 = new Path('/api/v3/data?testing=false&info=true', ctx);

      expect(path1.equals(path2)).toBe(true);
    });

    it('returns true when some query param differs but it is ignored even if param is not present', () => {
      const ctx = mockContext({
        ignoreQueryParams: ['info'],
      });

      const path1 = new Path('/api/v3/data?testing=false', ctx);
      const path2 = new Path('/api/v3/data?testing=false&info=true', ctx);

      expect(path1.equals(path2)).toBe(true);
    });

    it('returns true when arrays in query params are the same', () => {
      const ctx = mockContext();

      const path1 = new Path('/api/v3/data?array=a&array=b&array=c', ctx);
      const path2 = new Path('/api/v3/data?array=a&array=b&array=c', ctx);

      expect(path1.equals(path2)).toBe(true);
    });

    it('returns false when arrays in query params are different', () => {
      const ctx = mockContext();

      const path1 = new Path('/api/v3/data?array=a&array=b&array=c', ctx);
      const path2 = new Path('/api/v3/data?array=a&array=b&array=d', ctx);

      expect(path1.equals(path2)).toBe(false);
    });

    it('returns true when arrays in query params are different but array param is ignored', () => {
      const ctx = mockContext({
        ignoreQueryParams: ['array'],
      });

      const path1 = new Path('/api/v3/data?array=a&array=b&array=c', ctx);
      const path2 = new Path('/api/v3/data?array=a&array=b&array=d', ctx);

      expect(path1.equals(path2)).toBe(true);
    });
  });
});
