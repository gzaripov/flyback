import TapeStore from './tape-store';
import { Context, Options, createContext } from './context';
import { Request } from './http';
import Tape from './tape';

export default class TapeStoreManager {
  private context: Context;
  private tapeStores: TapeStore[];
  private defaultTapeStore?: TapeStore;

  constructor(options: Options) {
    this.context = createContext(options);
    this.tapeStores = [];

    if (this.context.tapesPath) {
      this.defaultTapeStore = new TapeStore(this.context.tapesPath, this.context);
      this.tapeStores.push(this.defaultTapeStore);
    }
  }

  getTapeStore(request?: Request) {
    if (request && this.context.tapePathGenerator) {
      const path = this.context.tapePathGenerator(request.toJson());

      if (path) {
        let tapeStore = this.findTapeStore(path);

        if (tapeStore) {
          return tapeStore;
        }

        tapeStore = new TapeStore(path, this.context);

        this.tapeStores.push(tapeStore);

        return tapeStore;
      }

      this.context.logger.log(
        `tapePathGenerator returned invalid path for ${request.pathname}, fallback to default tape store`,
      );
    }

    if (this.defaultTapeStore) {
      return this.defaultTapeStore;
    }

    throw new Error('Cant find path for tape store, use tapesPath or tapePathGenerator options');
  }

  findTapeStore(path: string) {
    return this.tapeStores.find((tapeStore) => tapeStore.hasPath(path));
  }

  getAllTapes(): Tape[] {
    return this.tapeStores.reduce(
      (tapes, tapeStore) => {
        return [...tapes, ...tapeStore.getAllTapes()];
      },
      [] as Tape[],
    );
  }
}
