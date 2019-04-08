import { UserOptions } from './options';

/* eslint-disable no-console */
export default class Logger {
  private options: UserOptions;

  constructor(options?: UserOptions) {
    this.options = options || ({} as UserOptions);
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
