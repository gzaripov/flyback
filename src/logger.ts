import { Context } from './options';

export default class Logger {
  private options: Context;

  constructor(options: Context = {} as Context) {
    this.options = options;
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
