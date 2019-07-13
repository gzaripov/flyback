import { Request } from '../../../src/http';
import { mockContext } from '../mocks';

describe('Request', () => {
  it('equals returns true when headers do not match but they are ignored', () => {
    const ctx = mockContext({
      ignoreAllHeaders: true,
    });

    const req1 = Request.fromJson(
      {
        pathname: '/api/analytics',
        query: {
          'types[]': 'PROJECT_PROJECT_BANS_LINE_CHART',
          intervalUnit: 'DAY',
          eventTimeFrom: '1559590863',
          eventTimeTo: '1555333429',
          chartTypes:
            'PROJECT_REGULAR_SUBMIT_LINE_CHART,PROJECT_EXPENSES_LINE_CHART,PROJECT_REGULAR_QUALITY_AVG_LINE_CHART,PROJECT_TRAINING_QUALITY_AVG_LINE_CHART,PROJECT_REGULAR_SUBMIT_TIME_AVG_LINE_CHART,PROJECT_REGULAR_UNIQUE_SUBMIT_WORKERS_LINE_CHART,PROJECT_PROJECT_BANS_LINE_CHART',
          entityId: '24',
          entityType: 'PROJECT',
        },
        method: 'GET',
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          cookie:
            'iuid=1562349088536870912; _ym_d=1562349088; mda=0; uid=9468301351562349088; i=n6AR4+BwuhDXygrltDx0VmGqsngRvmFy8Wp6ZmKre/nPw9uKLfWo1tCdFNu/MjyxqJ8wqY98V87jAvOq65rR2UcKH7s=; yp=1877709088.yrts.1562349088#1877709088.yrtsi.1562349088; JSESSIONID=node0107rp24gtfak04pi9pgz4bcrw10.node0',
        },
      },
      ctx,
    );

    const req2 = Request.fromJson(
      {
        pathname: '/api/analytics',
        query: {
          'types[]': 'PROJECT_PROJECT_BANS_LINE_CHART',
          intervalUnit: 'DAY',
          eventTimeFrom: '1559590863',
          eventTimeTo: '1555333429',
          chartTypes:
            'PROJECT_REGULAR_SUBMIT_LINE_CHART,PROJECT_EXPENSES_LINE_CHART,PROJECT_REGULAR_QUALITY_AVG_LINE_CHART,PROJECT_TRAINING_QUALITY_AVG_LINE_CHART,PROJECT_REGULAR_SUBMIT_TIME_AVG_LINE_CHART,PROJECT_REGULAR_UNIQUE_SUBMIT_WORKERS_LINE_CHART,PROJECT_PROJECT_BANS_LINE_CHART',
          entityId: '24',
          entityType: 'PROJECT',
        },
        method: 'GET',
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          referer: 'https://localhost.yandex.ru:9001/requester/project/24',
          'accept-encoding': 'gzip, deflate, br',
          cookie:
            'uid=4091562671563019307; i=wUly5v43Rc/3N1L6AaLPvxi3R3tjcJk4pHMRXyXtGs/3f0eAS4teOoC+umXYkfxLxZIEogIcF3wwYZ+c4eEFeJBZ2rc=; yp=1878379307.yrts.1563019307#1878379307.yrtsi.1563019307; JSESSIONID=node01pwzeau0pfiumih2fpmhdrgac9.node0',
        },
      },
      ctx,
    );

    expect(req1.equals(req2)).toBe(true);
  });
});
