import { Context } from './options';

export default class Logger {
  private options: Context;

  constructor(options?: Context) {
    this.options = options || ({} as Context);
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
