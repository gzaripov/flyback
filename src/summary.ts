import { Options } from './options';
import Tape from './tape';

export default class Sumary {
  private tapes: Tape[];
  private options: Options;

  constructor(tapes: Tape[], options: Options) {
    this.tapes = tapes;
    this.options = options;
  }

  print() {
    this.options.logger.log(`===== SUMMARY (${this.options.name}) =====`);
    const newTapes = this.tapes.filter((t) => t.new);

    if (newTapes.length > 0) {
      this.options.logger.log('New tapes:');
      newTapes.forEach((t) => this.options.logger.log(`- ${t.path}`));
    }
    const unusedTapes = this.tapes.filter((t) => !t.used);

    if (unusedTapes.length > 0) {
      this.options.logger.log('Unused tapes:');
      unusedTapes.forEach((t) => this.options.logger.log(`- ${t.path}`));
    }
  }
}
