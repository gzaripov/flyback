import zlib from 'zlib';
// we support node 8.+ so we cant use brotli from zlib as it is shipped in 10.+
import iltorb from 'iltorb';
import PrintableBody from './printable-body';
import MediaFormat from '../media-format';
import { Body } from './';

function encodeBodyData(buffer: Buffer, contentEncoding: string): Buffer {
  if (contentEncoding === 'gzip') {
    return zlib.gzipSync(buffer);
  }

  if (contentEncoding === 'br') {
    return zlib.brotliCompressSync(buffer);
  }

  if (contentEncoding === 'deflate') {
    return zlib.deflateSync(buffer);
  }

  return buffer;
}

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
  public mediaFormat: MediaFormat;

  constructor(encodedBuffer: Buffer, mediaFormat: MediaFormat, printableBody?: PrintableBody) {
    this.encodedBuffer = encodedBuffer;
    this.mediaFormat = mediaFormat;
    this.body =
      printableBody ||
      new PrintableBody(
        decodeBodyData(this.encodedBuffer, mediaFormat.contentEncoding() as string),
        mediaFormat,
      );
  }

  get length(): number {
    return this.encodedBuffer.byteLength;
  }

  isEmpty() {
    return this.length === 0;
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

  static fromJson(bodyJson: string | Object, mediaFormat: MediaFormat): EncodedBody {
    const printableBody = PrintableBody.fromJson(bodyJson, mediaFormat);
    const encodedBuffer = encodeBodyData(
      printableBody.toBuffer(),
      mediaFormat.contentEncoding() as string,
    );

    return new EncodedBody(encodedBuffer, mediaFormat, printableBody);
  }
}
