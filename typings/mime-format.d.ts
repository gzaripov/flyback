declare module 'mime-format' {
  export type MimeType =
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'embed'
    | 'message'
    | 'multipart'
    | 'unknown';

  export type MimeFormat =
    | 'audio'
    | 'video'
    | 'image'
    | 'plain'
    | 'jsonp'
    | 'json'
    | 'xml'
    | 'html'
    | 'yaml'
    | 'vml'
    | 'webml'
    | 'script'
    | 'raw';

  export const lookup: (
    contentType: string,
  ) => {
    type: MimeType;
    format: MimeFormat;
    charset: string;
  };
}
