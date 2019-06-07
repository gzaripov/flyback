import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import Tape from './tape';
import { Context } from './context';
import { Request } from './http';
import TapeFile from './tape-file';

export default class TapeStore {
  public tapeFiles: { [tapeName: string]: TapeFile };
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

    return tapeFile ? tapeFile.find(request) : null;
  }

  private findTapeFile(tape: Tape): TapeFile | null {
    return this.tapeFiles[tape.name];
  }

  save(tape: Tape) {
    this.context.tapeAnalyzer.markNew(tape);
    this.context.tapeAnalyzer.markUsed(tape);

    const tapePath = this.createTapePath(tape);

    let tapeFile = this.findTapeFile(tape);

    if (tapeFile) {
      tapeFile.add(tape);
    } else {
      tapeFile = new TapeFile(tapePath, this.context, [tape]);
      this.tapeFiles[tapeFile.name] = tapeFile;
    }

    tapeFile.save();
  }

  delete(tape: Tape) {
    this.context.tapeAnalyzer.markDeleted(tape);

    const tapeFile = this.findTapeFile(tape);

    if (tapeFile) {
      tapeFile.delete(tape);
      tapeFile.save();
    }
  }

  createTapePath(tape: Tape) {
    const tapePath = path.normalize(path.join(this.path, tape.name));

    mkdirp.sync(path.dirname(tapePath));

    return tapePath;
  }

  hasPath(pathToCheck: string) {
    return this.path === path.normalize(`${pathToCheck}/`);
  }
}
