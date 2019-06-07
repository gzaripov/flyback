import Headers from './headers';
import mimeFormat from 'mime-format';
import charset from 'charset';

const supportedEncodings = ['gzip', 'br', 'deflate', 'base64'];
const supportedCharsets = ['utf8', 'utf-8'];

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

    if (!this.isDecodable()) {
      return false;
    }

    return mimeFormat.lookup(contentType).type === 'text';
  }

  isJson(): boolean {
    const contentType = this.headers.contentType();

    if (!this.isDecodable()) {
      return false;
    }

    return !!contentType && mimeFormat.lookup(contentType).format === 'json';
  }

  contentEncoding() {
    return this.headers.contentEncoding();
  }

  charset() {
    const contentType = this.headers.contentType() || '';

    return (contentType && charset(contentType)) || 'utf8';
  }

  isDecodable(): boolean {
    const contentEncoding = this.contentEncoding();
    const charset = this.charset();

    if (
      contentEncoding &&
      contentEncoding !== 'identity' &&
      !supportedEncodings.includes(contentEncoding)
    ) {
      return false;
    }

    if (charset && !supportedCharsets.includes(charset)) {
      return false;
    }

    return true;
  }
}
