import create from '../../src/create';
import { FlybackServer } from '../../src/server';

describe('flyback.create', () => {
  it('Creates object with server, middleware and getStatistics', () => {
    const instance = create({});

    expect(instance).toEqual({
      server: expect.any(FlybackServer),
      middleware: expect.any(Function),
      getStatistics: expect.any(Function),
    });
  });
});
