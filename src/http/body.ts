import deepEqual from 'fast-deep-equal';
import MediaType from './media-type';

export default interface Body {
  length: number;
  mediaType: MediaType;
  equals(otherBody: Body): boolean;
  toBuffer(): Buffer;
  toJson(): any;
}

export class PrintableBody implements Body {
  private readonly buffer: Buffer;
  public readonly mediaType: MediaType;

  constructor(buffer: Buffer, mediaType: MediaType) {
    this.buffer = buffer;
    this.mediaType = mediaType;
  }

  get length() {
    return this.buffer.byteLength;
  }

  equals(otherBody: Body): boolean {
    if (
      this.mediaType.isJson() &&
      otherBody.mediaType.isJson() &&
      this.length > 0 &&
      otherBody.length > 0
    ) {
      return deepEqual(this.toJson(), otherBody.toJson());
    }

    return this.buffer.equals(otherBody.toBuffer());
  }

  toBuffer() {
    return this.buffer;
  }

  toJson() {
    if (this.mediaType.isJson()) {
      return JSON.parse(this.buffer.toString());
    }
    if (this.mediaType.isHumanReadable()) {
      return this.buffer.toString();
    } else {
      return this.buffer.toString('base64');
    }
  }

  static fromJson(data: string | Object, mediaType: MediaType) {
    if (typeof data === 'object') {
      return new PrintableBody(Buffer.from(JSON.stringify(data)), mediaType);
    }

    const encoding = mediaType.isHumanReadable() ? 'utf8' : 'base64';

    return new PrintableBody(Buffer.from(data, encoding), mediaType);
  }
}
