import chalk from 'chalk';
import TapeFile from './tape-file';
import p from 'pluralize';

export type TapeStats = {
  new?: boolean;
  used?: boolean;
  deleted?: boolean;
  loaded?: boolean;
  overwritten?: boolean;
};

export type Stats = {
  name: string;
  path: string;
  new?: boolean;
  used?: boolean;
  deleted?: boolean;
  loaded?: boolean;
  overwritten?: boolean;
};

export default class TapeAnalyzer {
  private tapeStats: Map<TapeFile, TapeStats>;

  constructor() {
    this.tapeStats = new Map();
  }

  getStatsForTape(tape: TapeFile) {
    return this.tapeStats.get(tape) || {};
  }

  statistics() {
    return [...this.tapeStats.entries()].map(([tapeFile, stats]) => {
      if (stats.overwritten) {
        delete stats.new;
        delete stats.deleted;
      }

      return {
        name: tapeFile.name,
        path: tapeFile.path,
        ...stats,
      };
    });
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

  printStatistics(statistics = this.statistics()) {
    const newTapes = statistics.filter((tape) => tape.new);
    const deletedTapes = statistics.filter((tape) => tape.deleted);
    const obsoleteTapes = statistics.filter((tape) => tape.loaded && !tape.used);
    const overwrittenTapes = statistics.filter((tape) => tape.overwritten);

    const printTapesCount = (count: number) => `${count.toString()} ${p('tape', count)}`;

    const printPath = ({ path }: { path: string }) => {
      const splitPoint = path.lastIndexOf('/') + 1;
      const dir = path.substring(0, splitPoint);
      const name = path.substring(splitPoint);

      return `  ${chalk.bold.gray(dir) + chalk.bold.white(name)}\n`;
    };

    let st = '';

    st += chalk.bold.white(`\nFlyback Summary\n`);

    if (newTapes.length > 0) {
      st += chalk.bold.green(` > ${printTapesCount(newTapes.length)} written:\n`);
      st += newTapes.map(printPath).join('');
    }

    if (deletedTapes.length > 0) {
      st += chalk.bold.green(` > ${printTapesCount(deletedTapes.length)} deleted:\n`);
      st += deletedTapes.map(printPath).join('');
    }

    if (overwrittenTapes.length > 0) {
      st += chalk.bold.green(` > ${printTapesCount(overwrittenTapes.length)} overwritten:\n`);
      st += overwrittenTapes.map(printPath).join('');
    }

    if (obsoleteTapes.length > 0) {
      st += chalk.bold.red(` > ${printTapesCount(obsoleteTapes.length)} obsolete:\n`);
      st += obsoleteTapes.map(printPath).join('');
    }

    console.log(st);
  }
}
