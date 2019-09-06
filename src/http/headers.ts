export interface HeadersJson {
  [header: string]: string | string[];
}

type EqualsOptions = {
  ignoreHeaders?: string[];
  checkHeaders?: string[];
};

export default class Headers {
  private headers: HeadersJson;

  constructor(headers: HeadersJson) {
    this.headers = this.normalizeHeaders(headers);
  }

  private normalizeHeaders(headers: HeadersJson) {
    const normalizeHeaders = {} as HeadersJson;

    const headerKeys = Object.keys(headers);

    for (const headerKey of headerKeys) {
      const headerValue =
        Array.isArray(headers[headerKey]) && headers[headerKey].length === 1
          ? headers[headerKey][0]
          : headers[headerKey];

      normalizeHeaders[headerKey.toLowerCase()] = headerValue;
    }

    return normalizeHeaders;
  }

  read(header: string) {
    return this.headers[header];
  }

  write(header: string, value: string | string[]) {
    this.headers[header] = value;
  }

  delete(header: string) {
    delete this.headers[header];
  }

  equals(otherHeaders: Headers, options: EqualsOptions = {}): boolean {
    const matchHeaders = this.filterHeaders(this.headers, options);
    const otherMatchHeaders = this.filterHeaders(otherHeaders.headers, options);

    if (matchHeaders.length !== otherMatchHeaders.length) {
      return false;
    }

    return matchHeaders.every((header) => {
      const thisHeader = this.headers[header];
      const otherHeader = otherHeaders.headers[header];

      if (Array.isArray(thisHeader) && Array.isArray(otherHeader)) {
        return thisHeader.toString() === otherHeader.toString();
      }

      if (thisHeader === otherHeader) {
        return true;
      }

      return thisHeader === otherHeader;
    });
  }

  private filterHeaders(
    headers: HeadersJson,
    { ignoreHeaders = [], checkHeaders = [] }: EqualsOptions,
  ) {
    const matchedHeaders = Object.keys(headers).filter((header) => !ignoreHeaders.includes(header));

    if (checkHeaders.length === 0) {
      return matchedHeaders;
    }

    return matchedHeaders.filter((header) => checkHeaders.includes(header));
  }

  contentType(): string | null {
    const contentType = this.headers['content-type'];

    if (!contentType) {
      return null;
    }

    const type = Array.isArray(contentType) ? contentType[0] : contentType;

    return type.toLowerCase().trim();
  }

  contentEncoding(): string | null {
    const contentEncoding = this.headers['content-encoding'];

    if (!contentEncoding) {
      return null;
    }

    const encoding = Array.isArray(contentEncoding) ? contentEncoding[0] : contentEncoding;

    return encoding.toLowerCase().trim();
  }

  toJSON(): HeadersJson {
    return this.headers;
  }
}
