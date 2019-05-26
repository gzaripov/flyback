import { Headers } from '../http/http';

const HeadersUtil = {
  read(headers: Headers, headerName: string) {
    const value = headers[headerName];

    if (Array.isArray(value)) {
      return value[0];
    } else {
      return value;
    }
  },

  write(headers: Headers, headerName: string, value: string) {
    headers[headerName] = [value];
  },
};

export { HeadersUtil };
