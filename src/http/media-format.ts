import Headers from './headers';
import mimeFormat from 'mime-format';

const supportedEncodings = ['gzip', 'br', 'deflate', 'base64'];

export default class MediaFormat {
  private headers: Headers;

  constructor(headers: Headers) {
    this.headers = headers;
  }

  isHumanReadable(): boolean {
    const contentType = this.headers.contentType();

    if (!contentType) {
      return false;
    }

    if (this.isEncoded() && !this.canBeDecoded()) {
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

    if (this.isEncoded() && !this.canBeDecoded()) {
      return false;
    }

    return !!contentType && mimeFormat.lookup(contentType).format === 'json';
  }

  contentEncoding() {
    return this.headers.contentEncoding();
  }

  canBeDecoded(): boolean {
    const contentEncoding = this.contentEncoding();

    return !!contentEncoding && supportedEncodings.includes(contentEncoding);
  }
}
