import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import Tape from './tape';
import { Context } from './context';
import { Request } from './http';
import TapeFile from './tape-file';

export default class TapeStore {
  private tapeFiles: { [tapeName: string]: TapeFile };
  private context: Context;
  private path: string;

  constructor(storePath: string, context: Context) {
    this.path = path.normalize(`${storePath}/`);
    this.context = context;
    this.tapeFiles = {};
    this.load();
  }

  load() {
    if (this.path) {
      mkdirp.sync(this.path);
      this.loadTapesAtDir(this.path);
    }
    this.context.logger.log(`Loaded ${Object.keys(this.tapeFiles).length} tapes`);
  }

  loadTapesAtDir(directory: string) {
    const items = fs.readdirSync(directory);

    for (const filename of items) {
      const fullPath = `${directory}${filename}`;
      const stat = fs.statSync(fullPath);

      if (!stat.isDirectory()) {
        try {
          const tapeFile = new TapeFile(fullPath, this.context);

          this.tapeFiles[tapeFile.name] = tapeFile;
          this.context.tapeAnalyzer.markLoaded(tapeFile);
        } catch (e) {
          this.context.logger.error(`Error reading tape ${fullPath}\n${e.toString()}`);
        }
      } else {
        this.loadTapesAtDir(`${fullPath}/`);
      }
    }
  }

  getAllTapes(): Tape[] {
    return Object.values(this.tapeFiles).reduce(
      (tapes, tapeFile) => [...tapes, ...tapeFile.getAllTapes()],
      [] as Tape[],
    );
  }

  find(request: Request): Tape | null {
    const tapeFile = this.tapeFiles[request.name];

    if (!tapeFile) {
      return null;
    }

    const tape = tapeFile.find(request);

    if (tape) {
      this.context.logger.log(`Found matching tape for ${request.fullPath} at ${this.path}`);
      this.context.tapeAnalyzer.markUsed(tapeFile);
    }

    return tape;
  }

  save(tape: Tape) {
    const tapePath = this.createTapePath(tape);

    let tapeFile = this.findTapeFile(tape);

    if (tapeFile) {
      tapeFile.add(tape);
    } else {
      tapeFile = new TapeFile(tapePath, this.context, [tape]);
      this.tapeFiles[tapeFile.name] = tapeFile;
    }

    tapeFile.save();

    this.context.tapeAnalyzer.markNew(tapeFile);
    this.context.tapeAnalyzer.markUsed(tapeFile);
  }

  delete(tape: Tape) {
    const tapeFile = this.findTapeFile(tape);

    if (tapeFile) {
      tapeFile.delete(tape);
      tapeFile.save();
      this.context.tapeAnalyzer.markDeleted(tapeFile);
    }
  }

  overwrite(oldTape: Tape, newTape: Tape) {
    const tapeFile = this.findTapeFile(oldTape);

    if (tapeFile) {
      this.context.tapeAnalyzer.markOverwritten(tapeFile);
    }

    this.delete(oldTape);
    this.save(newTape);
  }

  hasPath(pathToCheck: string) {
    return this.path === path.normalize(`${pathToCheck}/`);
  }

  private createTapePath(tape: Tape) {
    const tapePath = path.normalize(path.join(this.path, tape.name));

    mkdirp.sync(path.dirname(tapePath));

    return tapePath;
  }

  private findTapeFile(tape: Tape): TapeFile | null {
    return this.tapeFiles[tape.name];
  }
}
