import TapeStore from './tape-store';
import { Options } from './options';
import { Request } from './http';
import { Tape } from './tape';

export default class TapeStoreManager {
  private options: Options;
  private tapeStores: TapeStore[];
  private defaultTapeStore?: TapeStore;

  constructor(options: Options) {
    this.options = options;
    this.tapeStores = [];

    if (this.options.tapesPath) {
      this.defaultTapeStore = new TapeStore(options);
      this.tapeStores.push(this.defaultTapeStore);
    }
  }

  getTapeStore(request?: Request) {
    if (request && this.options.tapePathGenerator) {
      const path = this.options.tapePathGenerator(request);

      if (path) {
        let tapeStore = this.findTapeStore(path);

        if (tapeStore) {
          return tapeStore;
        }

        tapeStore = new TapeStore({
          ...this.options,
          tapesPath: path,
        });

        this.tapeStores.push(tapeStore);

        return tapeStore;
      }
    }

    if (this.defaultTapeStore) {
      return this.defaultTapeStore;
    }

    throw new Error('Cant find path for tape store, use options.path or options.tapePathGenerator');
  }

  findTapeStore(path: string) {
    return this.tapeStores.find((tapeStore) => tapeStore.hasPath(path));
  }

  hasTapeBeenUsed(tapeName: string) {
    return this.tapeStores.some((tapeStore) => tapeStore.hasTapeBeenUsed(tapeName));
  }

  resetTapeUsage(path?: string) {
    if (!path) {
      return this.tapeStores.forEach((tapeStore) => tapeStore.resetTapeUsage());
    }

    const store = this.findTapeStore(path);

    if (store) {
      return store.resetTapeUsage();
    }

    return false;
  }

  getAllTapes(): Tape[] {
    return this.tapeStores.reduce(
      (tapes, tapeStore) => {
        return [...tapes, ...tapeStore.tapes];
      },
      [] as Tape[],
    );
  }
}
