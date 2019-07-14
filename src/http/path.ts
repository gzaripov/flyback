import qs from 'query-string';
import deepEqual from 'fast-deep-equal';
import { Context } from '../context';

export default class Path {
  private readonly path: string;
  private readonly context: Context;

  constructor(path: string, context: Context) {
    this.path = this.normalizePath(path);
    this.context = context;
  }

  get name() {
    return this.path.split('?')[0];
  }

  private normalizePath(path: string) {
    if (!path.startsWith('/')) {
      return `/${path}`;
    }

    return path;
  }

  equals(otherPath: Path): boolean {
    const { ignoreAllQueryParams, ignoreQueryParams } = this.context;
    const [base, params = ''] = this.path.split('?');
    const [otherBase, otherParams = ''] = otherPath.path.split('?');

    const basesSame = base === otherBase;

    if (!basesSame) {
      return false;
    }

    if (ignoreAllQueryParams) {
      return true;
    }

    const parsedParams = qs.parse(params);
    const otherParsedParams = qs.parse(otherParams);

    if (ignoreQueryParams) {
      ignoreQueryParams.forEach((param) => {
        delete parsedParams[param];
        delete otherParsedParams[param];
      });
    }

    return deepEqual(parsedParams, otherParsedParams);
  }

  toString() {
    return this.path;
  }
}
