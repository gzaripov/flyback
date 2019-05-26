import contentTypeParser from 'content-type';
import { HeadersUtil } from './headers';
import { Headers } from '../http/http';

export const jsonTypes = ['application/json'];

const humanReadableContentTypes = [
  'application/javascript',
  'text/css',
  'text/html',
  'text/javascript',
  'text/plain',
  ...jsonTypes,
];

export default class MediaType {
  private headers: Headers;

  constructor(headers: Headers) {
    this.headers = headers;
  }

  isHumanReadable() {
    const contentEncoding = HeadersUtil.read(this.headers, 'content-encoding');
    const notCompressed = !contentEncoding || contentEncoding === 'identity';

    const contentType = this.contentType();

    if (!contentType) {
      return false;
    }

    return notCompressed && humanReadableContentTypes.indexOf(contentType.type) >= 0;
  }

  isJSON() {
    const contentType = this.contentType();

    if (!contentType) {
      return false;
    }

    return jsonTypes.indexOf(contentType.type) >= 0;
  }

  contentType() {
    const contentType = HeadersUtil.read(this.headers, 'content-type');

    if (!contentType) {
      return null;
    }

    return contentTypeParser.parse(contentType);
  }
}
