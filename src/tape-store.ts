import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { Tape } from './tape';
import { Context } from './options';
import { Request } from './http';
import TapeFile from './tape-file';

export default class TapeStore {
  public tapeFiles: TapeFile[];
  private context: Context;
  private path?: string;

  constructor(options: Context) {
    this.path = options.tapesPath && path.normalize(`${options.tapesPath}/`);
    this.context = options;
    this.tapeFiles = [];
    this.load();
  }

  load() {
    if (this.path) {
      mkdirp.sync(this.path);
      this.loadTapesAtDir(this.path);
    }
    this.context.logger.log(`Loaded ${this.tapeFiles.length} tapes`);
  }

  loadTapesAtDir(directory: string) {
    const items = fs.readdirSync(directory);

    for (const filename of items) {
      const fullPath = `${directory}${filename}`;
      const stat = fs.statSync(fullPath);

      if (!stat.isDirectory()) {
        try {
          const tapeFile = new TapeFile(fullPath, this.context);

          tapeFile.load();
          this.tapeFiles.push(tapeFile);
        } catch (e) {
          this.context.logger.error(`Error reading tape ${fullPath}\n${e.toString()}`);
        }
      } else {
        this.loadTapesAtDir(`${fullPath}/`);
      }
    }
  }

  getAllTapes(): Tape[] {
    return this.tapeFiles.reduce(
      (tapes, tapeFile) => [...tapes, ...tapeFile.getAllTapes()],
      [] as Tape[],
    );
  }

  find(request: Request, tapeFile?: TapeFile) {
    if (tapeFile) {
      return tapeFile.find(request);
    }

    return this.tapeFiles.find((tapeFile) => !!tapeFile.find(request));
  }

  findTapeFile(tape: Tape): TapeFile | undefined {
    return this.tapeFiles.find((tapeFile) => Boolean(this.find(tape.request, tapeFile)));
  }

  save(tape: Tape) {
    tape.meta.new = true;
    tape.meta.used = true;

    const tapePath = tape.meta.path || this.createTapePath(tape);

    let tapeFile = this.findTapeFile(tape);

    if (tapeFile) {
      tapeFile.add(tape);
    } else {
      tapeFile = new TapeFile(tapePath, this.context);
      tapeFile.add(tape);
      this.tapeFiles.push(tapeFile);
    }

    this.context.logger.log(`Saving request ${tape.request.url} at ${tape.meta.path}`);
  }

  currentTapeId() {
    return this.tapeFiles.length;
  }

  createTapeName(tape: Tape) {
    const currentTapeId = this.currentTapeId();
    const ext = this.context.tapeExtension;

    if (this.context.tapeNameGenerator) {
      const tapeName = this.context.tapeNameGenerator(tape, currentTapeId);

      if (!tapeName.endsWith(`.${ext}`)) {
        return `${tapeName}.${ext}`;
      }

      return tapeName;
    }

    const url = tape.request.url;

    const tapeName = url
      .split('?')[0]
      .split('/')
      .splice(1)
      .join('.');

    return `${tapeName}-${currentTapeId}.${ext}`;
  }

  createTapePath(tape: Tape) {
    const tapeName = this.createTapeName(tape);

    let result;

    if (this.context.tapePathGenerator) {
      result = this.context.tapePathGenerator(tape.request);
    }

    if (!result && this.context.tapesPath) {
      result = this.context.tapesPath;
    }

    if (!result) {
      throw new Error(`Cant create path for tape ${tape.request.url}`);
    }

    result = path.normalize(path.join(result, tapeName));

    const dir = path.dirname(result);

    mkdirp.sync(dir);

    return result;
  }

  hasPath(pathToCheck: string) {
    return this.path === path.normalize(`${pathToCheck}/`);
  }
}
