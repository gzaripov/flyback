import MediaFormat from '../media-format';
import { EncodedBody } from './encoded-body';
import PrintableBody from './printable-body';
import { Body } from './';

export default class BodyCreator {
  private mediaFormat: MediaFormat;

  constructor(mediaFormat: MediaFormat) {
    this.mediaFormat = mediaFormat;
  }

  createFromBuffer(buffer: Buffer): Body {
    return this.mediaFormat.isDecodable()
      ? new EncodedBody(buffer, this.mediaFormat)
      : new PrintableBody(buffer, this.mediaFormat);
  }

  createFromJson(bodyJson: string | object): Body {
    return this.mediaFormat.isDecodable()
      ? EncodedBody.fromJson(bodyJson, this.mediaFormat)
      : PrintableBody.fromJson(bodyJson, this.mediaFormat);
  }
}
