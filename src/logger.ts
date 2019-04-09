import { Options } from './options';

export default class Logger {
  private options: Options;

  constructor(options?: Options) {
    this.options = options || ({} as Options);
    if (this.options.debug) {
      console.debug('DEBUG mode active');
    }
  }

  log(message: any) {
    if (!this.options.silent) {
      console.log(message);
    }
  }

  debug(message: any) {
    if (this.options.debug) {
      console.debug(message);
    }
  }

  error(message: any) {
    console.error(message);
  }
}
