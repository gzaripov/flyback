import chalk from 'chalk';
import TapeFile from './tape-file';
import { Statistics } from './context';

export type TapeStats = {
  new?: boolean;
  used?: boolean;
  deleted?: boolean;
  loaded?: boolean;
  overwritten?: boolean;
};

export default class TapeAnalyzer {
  private tapeStats: Map<TapeFile, TapeStats>;

  constructor(registerStatsGetter?: (statsGetter: (stats: Statistics) => void) => void) {
    this.tapeStats = new Map();

    if (registerStatsGetter) {
      registerStatsGetter(this.statistics.bind(this));
    }
  }

  getStatsForTape(tape: TapeFile) {
    return this.tapeStats.get(tape) || {};
  }

  statistics() {
    return [...this.tapeStats.entries()].map(([tapeFile, stats]) => ({
      name: tapeFile.name,
      path: tapeFile.path,
      ...stats,
    }));
  }

  markLoaded(tape: TapeFile) {
    this.tapeStats.set(tape, { ...this.getStatsForTape(tape), loaded: true });
  }

  markOverwritten(tape: TapeFile) {
    this.tapeStats.set(tape, { ...this.getStatsForTape(tape), overwritten: true });
  }

  markUsed(tape: TapeFile) {
    this.tapeStats.set(tape, { ...this.getStatsForTape(tape), used: true });
  }

  markNew(tape: TapeFile) {
    this.tapeStats.set(tape, { ...this.getStatsForTape(tape), new: true });
  }

  markDeleted(tape: TapeFile) {
    this.tapeStats.set(tape, { ...this.getStatsForTape(tape), deleted: true });
  }

  printStatistics() {
    chalk.bold.white(`===== SUMMARY =====`);
    const stats = this.statistics();
    const newTapes = stats.filter((tape) => tape.new);

    if (newTapes.length > 0) {
      chalk.green('Written tapes:');
      newTapes.forEach((tape) => chalk.white(`- ${tape.path}`));
    }

    const unusedTapes = stats.filter((tape) => !tape.new);

    if (unusedTapes.length > 0) {
      chalk.red('Unused tapes:');
      unusedTapes.forEach((tape) => chalk.white(`- ${tape.path}`));
    }
  }
}
