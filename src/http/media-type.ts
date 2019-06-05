import Headers from './headers';
import mimeFormat from 'mime-format';

const supportedEncodings = ['gzip', 'br', 'deflate'];

export default class MediaType {
  private headers: Headers;

  constructor(headers: Headers) {
    this.headers = headers;
  }

  isHumanReadable(): boolean {
    const contentType = this.headers.contentType();

    if (!contentType) {
      return false;
    }

    return mimeFormat.lookup(contentType).type === 'text';
  }

  isCompressed(): boolean {
    const contentEncoding = this.contentEncoding();

    return !!contentEncoding && supportedEncodings.includes(contentEncoding);
  }

  isJson(): boolean {
    const contentType = this.headers.contentType();

    return !!contentType && mimeFormat.lookup(contentType).format === 'json';
  }

  contentEncoding() {
    return this.headers.contentEncoding();
  }
}
