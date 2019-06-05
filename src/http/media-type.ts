import Headers from './headers';
import mimeFormat from 'mime-format';

const supportedEncodings = ['gzip', 'br', 'deflate', 'base64'];

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

  isEncoded(): boolean {
    const contentEncoding = this.contentEncoding();

    return !!contentEncoding && contentEncoding !== 'identity';
  }

  isJson(): boolean {
    const contentType = this.headers.contentType();

    return !!contentType && mimeFormat.lookup(contentType).format === 'json';
  }

  contentEncoding() {
    return this.headers.contentEncoding();
  }
}
