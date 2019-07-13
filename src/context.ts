import url from 'url';
import assert from 'assert';
import Logger from './logger';
import { TapeJson } from './tape';
import { Agent } from 'https';
import { RequestJson } from './http/request';
import TapeAnalyzer from './tape-analyzer';

export type RecordMode =
  | 'NEW' // If no tape matches the request, proxy it and save the response to a tape
  | 'OVERWRITE' // Always proxy the request and save the response to a tape, overwriting any existing one
  | 'DISABLED' // If a matching tape exists, return it. Otherwise, don't proxy the request and use `fallbackMode` for the response
  | 'PROXY'; // Just proxy request, don't save tape

export const RecordModes = {
  NEW: 'NEW' as const,
  OVERWRITE: 'OVERWRITE' as const,
  DISABLED: 'DISABLED' as const,
  PROXY: 'PROXY' as const,
};

export type FallbackMode = 'NOT_FOUND' | 'PROXY';

export const FallbackModes = {
  NOT_FOUND: 'NOT_FOUND' as const,
  PROXY: 'PROXY' as const,
};

export type Options = {
  proxyUrl?: string;
  flybackUrl?: string;
  tapesPath?: string;
  recordMode?: RecordMode | ((request: RequestJson) => RecordMode);
  fallbackMode?: FallbackMode | ((request: RequestJson) => FallbackMode);
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
  summary?: boolean;
  verbose?: boolean;
  debug?: boolean;
  logger?: Logger;
};

const defaultOptions = {
  flybackUrl: 'http://localhost:8080',
  recordMode: RecordModes.NEW as RecordMode | ((request: RequestJson) => RecordMode),
  fallbackMode: 'NOT_FOUND' as FallbackMode | ((request: RequestJson) => FallbackMode),
  ignoreHeaders: ['content-length', 'host'],
  verbose: false,
  summary: true,
  debug: false,
  tapeExtension: 'json',
};

export type Context = Options &
  typeof defaultOptions & {
    tapeAnalyzer: TapeAnalyzer;
    logger: Logger;
  };

export function validateRecord(record?: RecordMode | ((request: RequestJson) => RecordMode)) {
  if (typeof record === 'string' && !Object.keys(RecordModes).includes(record)) {
    throw new Error(`INVALID OPTION: record has an invalid value of '${record}'`);
  }
}

export function validateFallbackMode(
  fallbackMode?: FallbackMode | ((request: RequestJson) => FallbackMode),
) {
  if (typeof fallbackMode === 'string' && !Object.keys(FallbackModes).includes(fallbackMode)) {
    throw new Error(`INVALID OPTION: fallbackMode has an invalid value of '${fallbackMode}'`);
  }
}

function validateUrl(siteUrl: string) {
  const { protocol, host } = url.parse(siteUrl);

  if (!protocol || !protocol.startsWith('http')) {
    throw new Error(`${siteUrl} is not valid, pass url with http or https protocol`);
  }

  assert(host, `${siteUrl} is not valid, pass url with host`);
}

function validateOptions(opts: Options) {
  if (opts.flybackUrl) {
    validateUrl(opts.flybackUrl);
  }
  if (opts.proxyUrl) {
    validateUrl(opts.proxyUrl);
  }
  validateRecord(opts.recordMode);
  validateFallbackMode(opts.fallbackMode);
}

export type ContextOptions = {
  analyzer?: TapeAnalyzer;
};

export function createContext(userOpts: Options, { analyzer }: ContextOptions = {}): Context {
  validateOptions(userOpts);

  return {
    ...defaultOptions,
    logger: new Logger({ ...defaultOptions, ...userOpts } as Context),
    ...userOpts,
    tapeAnalyzer: analyzer || new TapeAnalyzer(),
  };
}
