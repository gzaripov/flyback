import deepEqual from 'fast-deep-equal';
import MediaFormat from '../media-format';
import Body from './body';

export default class PrintableBody implements Body {
  private readonly buffer: Buffer;
  public readonly mediaFormat: MediaFormat;

  constructor(buffer: Buffer, mediaFormat: MediaFormat) {
    this.buffer = buffer;
    this.mediaFormat = mediaFormat;
  }

  get length() {
    return this.buffer.byteLength;
  }

  isEmpty() {
    return this.length === 0;
  }

  equals(otherBody: Body): boolean {
    if (
      this.mediaFormat.isJson() &&
      otherBody.mediaFormat.isJson() &&
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
    const charset = this.mediaFormat.charset() as BufferEncoding;

    if (this.mediaFormat.isJson()) {
      return JSON.parse(this.buffer.toString(charset));
    }

    if (this.mediaFormat.isHumanReadable()) {
      return this.buffer.toString(charset);
    }

    return this.buffer.toString('base64');
  }

  static fromJson(bodyJson: string | Object, mediaFormat: MediaFormat) {
    if (typeof bodyJson === 'object') {
      return new PrintableBody(Buffer.from(JSON.stringify(bodyJson)), mediaFormat);
    }

    const encoding = mediaFormat.isHumanReadable() ? 'utf8' : 'base64';

    return new PrintableBody(Buffer.from(bodyJson, encoding), mediaFormat);
  }
}
