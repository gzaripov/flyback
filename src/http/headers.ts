export interface HeadersJson {
  [header: string]: string | string[];
}

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

  equals(otherHeaders: Headers, { ignoreHeaders = [] as string[] } = {}): boolean {
    const matchHeaders = Object.keys(this.headers).filter(
      (header) => !ignoreHeaders.includes(header),
    );

    const otherMatchHeaders = Object.keys(otherHeaders.headers).filter(
      (header) => !ignoreHeaders.includes(header),
    );

    if (matchHeaders.length !== otherMatchHeaders.length) {
      return false;
    }

    return matchHeaders.every((header) => {
      return this.headers[header].toString() === otherHeaders.headers[header].toString();
    });
  }

  contentType(): string | null {
    const contentType = this.headers['content-type'];

    if (Array.isArray(contentType)) {
      return contentType[0];
    }

    return contentType || null;
  }

  contentEncoding(): string | null {
    const contentEncoding = this.headers['content-encoding'];

    if (!contentEncoding) {
      return null;
    }

    if (Array.isArray(contentEncoding)) {
      return contentEncoding[0];
    }

    return contentEncoding.toLowerCase().trim();
  }

  toJSON(): HeadersJson {
    return this.headers;
  }
}
