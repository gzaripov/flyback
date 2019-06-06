import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';
import fetch, { RequestInit } from 'node-fetch';
import tcp from 'tcp-port-used';
import findFreePort from 'find-free-port-sync';
import { Options } from '../../src/context';
import FlybackServer from '../../src/server';
import { RequestJson } from '../../src/http/request';
import { apiUrl } from './api-server';
import { TapeJson } from '../../src/tape';
import { urlToListenOptions } from '../../src/utils/url';

const CHECK_PORT_RETRY_TIME = 20;
const CHECK_PORT_TIMEOUT = 1000;
const ORIGINAL_TAPES_PATH = `${__dirname}/tapes/original`;

export const flybackPort = findFreePort({
  start: 9000,
  end: 9999,
});
export const tapesPath = `${__dirname}/tapes/tmp-tapes-${flybackPort}`;
export const flybackUrl = `http://localhost:${flybackPort}`;
export const flybackHost = `localhost:${flybackPort}`;

function normalizePath(url) {
  return url.startsWith('/') ? url.substring(1) : url;
}

export function takeTapeNameFromPath(path) {
  return normalizePath(path)
    .split('/')
    .join('.');
}

export function readJSONFromFile(tapesPath: string, url: string): TapeJson {
  const fileName = takeTapeNameFromPath(url);

  return JSON.parse(fs.readFileSync(`${tapesPath}/${fileName}.json`).toString());
}

const tapeNameGenerator = (request: RequestJson) => takeTapeNameFromPath(request.path);

// instance of flyback server can only be used in one test
export async function withFlyback<T>(run: (() => T) | (() => Promise<T>), opts?: Partial<Options>) {
  fsExtra.copySync(ORIGINAL_TAPES_PATH, tapesPath, { overwrite: true });

  const flybackServer = new FlybackServer({
    proxyUrl: apiUrl,
    flybackUrl,
    tapesPath,
    recordMode: 'NEW',
    summary: false,
    tapeNameGenerator,
    ...opts,
  });

  const { host, port } = urlToListenOptions(flybackUrl);

  await tcp.waitUntilFreeOnHost(port, host, CHECK_PORT_RETRY_TIME, CHECK_PORT_TIMEOUT);

  await flybackServer.start();

  const result = await run();

  await flybackServer.close();

  return result;
}

export function flybackFetch(
  relativeUrl: string,
  init?: RequestInit,
  flybackOpts: Partial<Options> = {},
) {
  const protocol = flybackOpts.https ? 'https' : 'http';
  const flybackUrl = `${protocol}://${flybackHost}`;

  return withFlyback(
    () => fetch(`${flybackUrl}/${normalizePath(relativeUrl)}`, { compress: false, ...init }),
    {
      ...flybackOpts,
      flybackUrl,
    },
  );
}

function cleanupTapes() {
  if (!fs.existsSync(tapesPath)) {
    return;
  }

  const files = fs.readdirSync(tapesPath);

  for (let i = 0, len = files.length; i < len; i++) {
    const match = files[i].match(/test./);

    if (match !== null) {
      fs.unlinkSync(path.join(tapesPath, files[i]));
    }
  }
}

beforeEach(() => cleanupTapes());

afterAll(() => {
  fsExtra.removeSync(tapesPath);
});
