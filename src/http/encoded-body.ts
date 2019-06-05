import zlib from 'zlib';
// we support node 8.+ so we cant use brotli from zlib as it is shipped in 10.+
import iltorb from 'iltorb';
import Body, { PrintableBody } from './body';
import MediaType from './media-type';

function decodeBodyData(buffer: Buffer, contentEncoding: string) {
  if (contentEncoding === 'gzip') {
    return zlib.gunzipSync(buffer);
  }

  if (contentEncoding === 'br') {
    return iltorb.decompressSync(buffer);
  }

  if (contentEncoding === 'deflate') {
    return zlib.inflateSync(buffer);
  }

  if (contentEncoding === 'base64') {
    return Buffer.from(buffer.toString(), 'base64');
  }

  return buffer;
}

export class EncodedBody implements Body {
  private body: PrintableBody;
  private encodedBuffer: Buffer;
  public mediaType: MediaType;

  constructor(buffer: Buffer, mediaType: MediaType) {
    this.encodedBuffer = buffer;
    this.mediaType = mediaType;
    this.body = new PrintableBody(
      decodeBodyData(this.encodedBuffer, mediaType.contentEncoding() as string),
      mediaType,
    );
  }

  get length(): number {
    return this.encodedBuffer.byteLength;
  }

  equals(otherBody: Body): boolean {
    return this.body.equals(otherBody);
  }

  toBuffer(): Buffer {
    return this.encodedBuffer;
  }

  toJson() {
    return this.body.toJson();
  }
}
