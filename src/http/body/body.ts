import MediaFormat from '../media-format';

export default interface Body {
  length: number;
  mediaFormat: MediaFormat;

  isEmpty(): boolean;
  equals(otherBody: Body): boolean;
  toBuffer(): Buffer;
  toJson(): any;
}
