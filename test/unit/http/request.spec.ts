import { Request, Headers } from '../../../src/http';
import { mockContext } from '../mocks';

describe('Request', () => {
  describe('equals', () => {
    it('returns true when headers do not match but they are ignored', () => {
      const ctx = mockContext({
        ignoreAllHeaders: true,
      });

      const req1 = Request.fromJson(
        {
          method: 'GET',
          pathname: '/api/analytics',
          headers: {
            accept: 'application/json',
            cookie:
              'n6AR4+BwuhDXygrltDx0VmGqsngRvmFy8Wp6ZmKre/nPw9uKLfWo1tCdFNu/MjyxqJ8wqY98V87jAvOq65rR2UcKH7s=;',
          },
        },
        ctx,
      );

      const req2 = Request.fromJson(
        {
          method: 'GET',
          pathname: '/api/analytics',
          headers: {
            accept: 'application/json',
            cookie:
              'wUly5v43Rc/3N1L6AaLPvxi3R3tjcJk4pHMRXyXtGs/3f0eAS4teOoC+umXYkfxLxZIEogIcF3wwYZ+c4eEFeJBZ2rc=',
          },
        },
        ctx,
      );

      expect(req1.equals(req2)).toBe(true);
    });
  });

  describe('works with arrays in query params', () => {
    it('toJson returns query object with array when path query contains param array', () => {
      const context = mockContext();

      const request = new Request({
        path: '/api/v4/users?users[]=user1&users[]=user2&users[]=user3',
        headers: new Headers({}),
        context,
      });

      expect(request.toJson()).toEqual({
        method: 'GET',
        pathname: '/api/v4/users',
        query: {
          'users[]': ['user1', 'user2', 'user3'],
        },
        headers: {},
        body: undefined,
      });
    });

    it('creates tape from json with query that contains arrays', () => {
      const context = mockContext();

      const request = Request.fromJson(
        {
          method: 'GET',
          pathname: '/api/v4/users',
          query: {
            'users[]': ['user1', 'user2', 'user3'],
          },
          headers: {},
        },
        context,
      );

      expect(request.fullPath).toBe(
        encodeURI('/api/v4/users?users[]=user1&users[]=user2&users[]=user3'),
      );
    });
  });

  it('ignores trailing slash in path when generating name', () => {
    const context = mockContext();

    const request = new Request({
      path: '/api/v4/users/',
      headers: new Headers({}),
      context,
    });

    expect(request.name).toBe('api.v4.users');
  });
});
