import Tape from './tape';

export type TapeStats = {
  new?: boolean;
  used?: boolean;
};

export default class TapeAnalyzer {
  private tapeStats: Map<Tape, TapeStats>;

  constructor() {
    this.tapeStats = new Map();
  }

  getStatsForTape(tape: Tape) {
    return this.tapeStats.get(tape) || {};
  }

  markUsed(tape: Tape) {
    this.tapeStats.set(tape, { ...this.getStatsForTape(tape), used: true });
  }

  markNew(tape: Tape) {
    this.tapeStats.set(tape, { ...this.getStatsForTape(tape), new: true });
  }

  printStatistics() {
    console.log(`===== SUMMARY =====`);
    const tapeEntries = [...this.tapeStats.entries()];
    const newTapes = tapeEntries.filter(([, stats]) => stats.new);

    if (newTapes.length > 0) {
      console.log('New tapes:');
      newTapes.forEach(([tape]) => console.log(`- ${tape.request.fullPath}`));
    }

    const unusedTapes = tapeEntries.filter(([tape, stats]) => !stats.new && tape);

    if (unusedTapes.length > 0) {
      console.log('Unused tapes:');
      unusedTapes.forEach(([tape]) => console.log(`- ${tape.request.fullPath}`));
    }
  }
}
