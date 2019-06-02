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

    if (ignoreAllQueryParams && basesSame) {
      return true;
    }

    if (ignoreQueryParams) {
      const ignoreParams = ignoreQueryParams;
      const matchParams = params
        .split('&')
        .filter((p) => {
          const paramName = p.split('=')[0];

          return !ignoreParams.includes(paramName);
        })
        .join('');

      const otherMatchParams = otherParams
        .split('&')
        .filter((p) => {
          const paramName = p.split('=')[0];

          return !ignoreParams.includes(paramName);
        })
        .join('');

      return basesSame && matchParams === otherMatchParams;
    }

    return basesSame;
  }

  toString() {
    return this.path;
  }
}
