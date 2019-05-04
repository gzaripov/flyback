import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { Tape, createTapeFromJSON } from './tape';
import TapeFinder from './tape-matcher';
import TapeRenderer from './tape-renderer';
import { Context } from './options';
import { Request } from './http';

export default class TapeStore {
  public tapes: Tape[];
  private context: Context;
  private path?: string;

  constructor(options: Context) {
    this.path = options.tapesPath && path.normalize(`${options.tapesPath}/`);
    this.context = options;
    this.tapes = [];
    this.load();
  }

  load() {
    if (this.path) {
      mkdirp.sync(this.path);
      this.loadTapesAtDir(this.path);
    }
    this.context.logger.log(`Loaded ${this.tapes.length} tapes`);
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
          this.context.logger.error(`Error reading tape ${fullPath}\n${e.toString()}`);
        }
      } else {
        this.loadTapesAtDir(`${fullPath}/`);
      }
    }
  }

  find(request: Request) {
    const foundTape = this.tapes.find((t) => {
      this.context.logger.debug(`Comparing against tape ${t.meta.path}`);

      return new TapeFinder(t, this.context).matches(request);
    });

    if (foundTape) {
      foundTape.meta.used = true;
      this.context.logger.log(`Found matching tape for ${request.url} at ${foundTape.meta.path}`);

      return foundTape;
    }

    return null;
  }

  save(tape: Tape) {
    tape.meta.new = true;
    tape.meta.used = true;

    const tapePath = tape.meta.path;

    let fullFilename;

    if (this.path && tapePath) {
      fullFilename = path.join(this.path, tapePath);
    } else {
      // If the tape doesn't have a path then it's new
      this.tapes.push(tape);

      fullFilename = this.createTapePath(tape);
      tape.meta.path = this.path ? path.relative(this.path, fullFilename) : fullFilename;
    }
    this.context.logger.log(`Saving request ${tape.request.url} at ${tape.meta.path}`);

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
    this.tapes.forEach((t) => (t.meta.used = false));
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
