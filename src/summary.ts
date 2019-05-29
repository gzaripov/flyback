import { Context } from './options';
import Tape from './tape';

export default class Sumary {
  private tapes: Tape[];
  private options: Context;

  constructor(tapes: Tape[], options: Context) {
    this.tapes = tapes;
    this.options = options;
  }

  print() {
    this.options.logger.log(`===== SUMMARY (${this.options.name}) =====`);
    const newTapes = this.tapes.filter((t) => t.meta.new);

    if (newTapes.length > 0) {
      this.options.logger.log('New tapes:');
      newTapes.forEach((t) => this.options.logger.log(`- ${t.meta.path}`));
    }
    const unusedTapes = this.tapes.filter((t) => !t.meta.used);

    if (unusedTapes.length > 0) {
      this.options.logger.log('Unused tapes:');
      unusedTapes.forEach((t) => this.options.logger.log(`- ${t.meta.path}`));
    }
  }
}
