import contentTypeParser from 'content-type';
import { HeadersUtil } from './headers';
import { RequestOrResponse, Headers } from '../types/http';

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
  private htmlReqRes: RequestOrResponse;

  constructor(htmlReqRes: RequestOrResponse) {
    this.htmlReqRes = htmlReqRes;
  }

  isHumanReadable() {
    const contentEncoding = HeadersUtil.read(this.headers(), 'content-encoding');
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
    const contentType = HeadersUtil.read(this.headers(), 'content-type');

    if (!contentType) {
      return null;
    }

    return contentTypeParser.parse(contentType);
  }

  headers(): Headers {
    return this.htmlReqRes.headers;
  }
}
