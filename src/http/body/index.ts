import BodyCreator from './body-creator';
import MediaFormat from '../media-format';

export interface Body {
  length: number;
  mediaFormat: MediaFormat;

  isEmpty(): boolean;
  equals(otherBody: Body): boolean;
  toBuffer(): Buffer;
  toJson(): any;
}

export { BodyCreator };
