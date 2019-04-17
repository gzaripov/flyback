import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { Tape, createTapeFromJSON } from './tape';
import TapeFinder from './tape-matcher';
import TapeRenderer from './tape-renderer';
import { Options } from './options';
import { Request } from './types/http';

export default class TapeStore {
  public tapes: Tape[];
  private options: Options;
  private path: string;

  constructor(options: Options) {
    this.path = path.normalize(`${options.tapesPath}/`);
    this.options = options;
    this.tapes = [];
    this.load();
  }

  load() {
    mkdirp.sync(this.path);

    this.loadTapesAtDir(this.path);
    this.options.logger.log(`Loaded ${this.tapes.length} tapes`);
  }

  loadTapesAtDir(directory: string) {
    const items = fs.readdirSync(directory);

    for (let i = 0; i < items.length; i++) {
      const filename = items[i];
      const fullPath = `${directory}${filename}`;
      const stat = fs.statSync(fullPath);

      if (!stat.isDirectory()) {
        try {
          const data = fs.readFileSync(fullPath, 'utf8');
          const raw = JSON.parse(data);
          const tape = createTapeFromJSON(raw);

          tape.meta.path = filename;
          this.tapes.push(tape);
        } catch (e) {
          this.options.logger.error(`Error reading tape ${fullPath}\n${e.toString()}`);
        }
      } else {
        this.loadTapesAtDir(`${fullPath}/`);
      }
    }
  }

  find(request: Request) {
    const foundTape = this.tapes.find((t) => {
      this.options.logger.debug(`Comparing against tape ${t.meta.path}`);

      return new TapeFinder(t, this.options).matches(request);
    });

    if (foundTape) {
      foundTape.meta.used = true;
      this.options.logger.log(`Found matching tape for ${request.url} at ${foundTape.meta.path}`);

      return foundTape;
    }

    return null;
  }

  save(tape: Tape) {
    tape.meta.new = true;
    tape.meta.used = true;

    const tapePath = tape.meta.path;

    let fullFilename;

    if (tapePath) {
      fullFilename = path.join(this.path, tapePath);
    } else {
      // If the tape doesn't have a path then it's new
      this.tapes.push(tape);

      fullFilename = this.createTapePath(tape);
      tape.meta.path = path.relative(this.path, fullFilename);
    }
    this.options.logger.log(`Saving request ${tape.request.url} at ${tape.meta.path}`);

    const toSave = new TapeRenderer(tape).render();

    fs.writeFileSync(fullFilename, JSON.stringify(toSave, null, 2));
  }

  currentTapeId() {
    return this.tapes.length;
  }

  hasTapeBeenUsed(tapeName: string) {
    return this.tapes.some((t) => t.meta.used && t.meta.path === tapeName);
  }

  resetTapeUsage() {
    return this.tapes.forEach((t) => (t.meta.used = false));
  }

  createTapePath(tape: Tape) {
    const currentTapeId = this.currentTapeId();

    let tapePath = `unnamed-${currentTapeId}.json`;

    if (this.options.tapeNameGenerator) {
      tapePath = this.options.tapeNameGenerator(tape, currentTapeId);
    }

    let result;

    if (this.options.tapePathGenerator) {
      result = this.options.tapePathGenerator(tape.request);
    }

    if (!result && this.options.tapesPath) {
      result = path.normalize(path.join(this.options.tapesPath, tapePath));
    }

    if (!result) {
      throw new Error(`Cant create path for tape ${tape.request.url}`);
    }

    if (!result.endsWith('.json')) {
      result = `${result}.json`;
    }

    const dir = path.dirname(result);

    mkdirp.sync(dir);

    return result;
  }

  hasPath(pathToCheck: string) {
    return this.path === path.normalize(`${pathToCheck}/`);
  }
}
