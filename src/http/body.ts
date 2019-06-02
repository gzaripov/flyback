import deepEqual from 'fast-deep-equal';
// import zlib from 'zlib';
import MediaType from './media-type';
import { formatJsonString } from '../utils/format-json';

export type BodyData = string | Buffer | Object;

function bodyDataToBuffer(data: BodyData) {
  if (typeof data === 'string') {
    return Buffer.from(data);
  }
  if (data instanceof Buffer) {
    return data;
  }
  if (typeof data === 'object') {
    return Buffer.from(JSON.stringify(data));
  }

  throw new Error('Invalid body data type');
}

export default class Body {
  private readonly buffer: Buffer;
  private readonly mediaType: MediaType;

  constructor(data: BodyData, mediaType: MediaType) {
    this.buffer = this.normalize(bodyDataToBuffer(data), mediaType);
    this.mediaType = mediaType;
  }

  private normalize(buffer: Buffer, mediaType: MediaType) {
    if (mediaType.isJSON() && buffer && buffer.length > 0) {
      return Buffer.from(formatJsonString(buffer.toString()));
    }

    return buffer;
  }

  get length() {
    return this.buffer.byteLength;
  }

  equals(otherBody: Body): boolean {
    if (
      this.mediaType.isJSON() &&
      otherBody.mediaType.isJSON() &&
      this.length > 0 &&
      otherBody.length > 0
    ) {
      return deepEqual(this.toJSON(), otherBody.toJSON());
    }

    return this.buffer.equals(otherBody.buffer);
  }

  toBuffer() {
    return this.buffer;
  }

  toJSON() {
    if (this.mediaType.isJSON()) {
      return JSON.parse(this.buffer.toString('utf8'));
    }
    if (this.mediaType.isHumanReadable()) {
      return this.buffer.toString('utf8');
    } else {
      return this.buffer.toString('base64');
    }
  }
}
