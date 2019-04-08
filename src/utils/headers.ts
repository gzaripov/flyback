import { Headers } from '../types/http';

const HeadersUtil = {
  read(headers: Headers, headerName: string) {
    const value = headers[headerName];

    if (Array.isArray(value)) {
      return value[0];
    } else {
      return value;
    }
  },

  write(headers: Headers, headerName: string, value: string, type: string) {
    if (type !== 'req') {
      throw new Error('expect type req');
    }
    headers[headerName] = [value];
  },
};

export { HeadersUtil, Headers };
