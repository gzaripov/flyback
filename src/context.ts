import Logger from './logger';
import { TapeJson } from './tape';
import { Agent } from 'https';
import { Request } from './http';
import { RequestJson } from './http/request';
import TapeAnalyzer from './tape-analyzer';

export type RecordMode =
  | 'NEW' // If no tape matches the request, proxy it and save the response to a tape
  | 'OVERWRITE' // Always proxy the request and save the response to a tape, overwriting any existing one
  | 'DISABLED' // If a matching tape exists, return it. Otherwise, don't proxy the request and use `fallbackMode` for the response
  | 'PROXY'; // Just proxy request, don't save tape

export const RecordModes = {
  NEW: 'NEW',
  OVERWRITE: 'OVERWRITE',
  DISABLED: 'DISABLED',
  PROXY: 'PROXY',
};

export type FallbackMode = 'NOT_FOUND' | 'PROXY';

export const FallbackModes = {
  NOT_FOUND: 'NOT_FOUND',
  PROXY: 'PROXY',
};

export type Options = {
  proxyUrl: string;
  flybackUrl?: string;
  tapesPath?: string;
  recordMode?: RecordMode | ((request: Request) => RecordMode);
  fallbackMode?: FallbackMode | ((request: Request) => FallbackMode);
  name?: string;
  tapeNameGenerator?: (request: RequestJson) => string;
  tapePathGenerator?: (request: RequestJson) => string;
  tapeFileExtension?: string;
  https?: {
    keyPath: string;
    certPath: string;
  };
  agent?: Agent;
  ignoreQueryParams?: string[];
  ignoreAllQueryParams?: boolean;
  ignoreHeaders?: string[];
  ignoreAllHeaders?: boolean;
  ignoreBody?: boolean;
  tapeMatcher?: (tape: TapeJson, request: RequestJson) => boolean;
  tapeDecorator?: (tape: TapeJson) => TapeJson;
  silent?: boolean;
  summary?: boolean;
  debug?: boolean;
  logger?: Logger;
};

const defaultOptions = {
  flybackUrl: 'localhost:8080',
  recordMode: 'NEW' as RecordMode | ((request: Request) => RecordMode),
  fallbackMode: 'NOT_FOUND' as FallbackMode | ((request: Request) => FallbackMode),
  name: 'unnamed',
  ignoreHeaders: ['content-length', 'host'],
  silent: false,
  summary: true,
  debug: false,
  logger: new Logger(),
  tapeExtension: 'json',
};

export type Context = Options &
  typeof defaultOptions & {
    tapeAnalyzer: TapeAnalyzer;
  };

export function validateRecord(record?: RecordMode | ((request: Request) => RecordMode)) {
  if (typeof record === 'string' && !Object.keys(RecordModes).includes(record)) {
    throw new Error(`INVALID OPTION: record has an invalid value of '${record}'`);
  }
}

export function validateFallbackMode(
  fallbackMode?: FallbackMode | ((request: Request) => FallbackMode),
) {
  if (typeof fallbackMode === 'string' && !Object.keys(FallbackModes).includes(fallbackMode)) {
    throw new Error(`INVALID OPTION: fallbackMode has an invalid value of '${fallbackMode}'`);
  }
}

function validateOptions(opts: Options) {
  validateRecord(opts.recordMode);
  validateFallbackMode(opts.fallbackMode);
}

export function createContext(userOpts: Options) {
  validateOptions(userOpts);

  return {
    ...defaultOptions,
    name: userOpts.proxyUrl,
    logger: new Logger({ ...defaultOptions, ...userOpts } as Context),
    ...userOpts,
    tapeAnalyzer: new TapeAnalyzer(),
  };
}
