import zlib from 'zlib';
import Body, { PrintableBody } from './body';
import MediaType from './media-type';

// function encodeBodyData(buffer: Buffer, contentEncoding: string): Buffer {
//   if (contentEncoding === 'gzip') {
//     return zlib.gzipSync(buffer);
//   }

//   if (contentEncoding === 'br') {
//     return zlib.brotliCompressSync(buffer);
//   }

//   if (contentEncoding === 'deflate') {
//     return zlib.deflateSync(buffer);
//   }

//   return buffer;
// }

function decodeBodyData(buffer: Buffer, contentEncoding: string) {
  if (contentEncoding === 'gzip') {
    return zlib.gunzipSync(buffer);
  }

  if (contentEncoding === 'br') {
    return zlib.brotliDecompressSync(buffer);
  }

  if (contentEncoding === 'deflate') {
    return zlib.inflateSync(buffer);
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
