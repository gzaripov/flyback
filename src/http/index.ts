import Request from './request';
import Response from './response';

export interface Headers {
  [header: string]: string[];
}

export type RequestOrResponse = Request | Response;

export { Request, Response };
