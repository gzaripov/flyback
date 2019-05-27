export interface HeadersJson {
  [header: string]: string | string[] | undefined;
}

export default class Headers {
  private headers: HeadersJson;

  constructor(headers: HeadersJson) {
    this.headers = headers;
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

  contentType(): string | undefined {
    const contentType = this.headers['content-type'];

    if (Array.isArray(contentType)) {
      return contentType[0];
    }

    return contentType;
  }

  toJSON(): HeadersJson {
    return this.headers;
  }
}
