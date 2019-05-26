import fs from 'fs';
import path from 'path';
import { Tape, createTapeFromJSON, SerializedTape } from './tape';
import TapeRenderer from './tape-renderer';
import { Request } from './http/http';
import { Context } from './options';
import TapeMatcher from './tape-matcher';

export default class TapeFile {
  private path: string;
  private tapes: Tape[];
  private context: Context;

  constructor(filePath: string, context: Context) {
    this.path = path.normalize(filePath);
    this.tapes = [];
    this.context = context;

    if (fs.existsSync(filePath)) {
      this.load();
    }
  }

  get name(): string {
    return '';
  }

  getAllTapes() {
    return this.tapes;
  }

  private load() {
    try {
      const fileText = fs.readFileSync(this.path, 'utf8');
      const jsonTapes: SerializedTape[] = JSON.parse(fileText);

      this.tapes = jsonTapes.map((tapeJson) => createTapeFromJSON(tapeJson));
    } catch (e) {
      throw new Error(`Error reading tape ${this.path}\n${e.toString()}`);
    }
  }

  save() {
    const json = this.tapes.map((tape) => new TapeRenderer().renderTape(tape));

    fs.writeFileSync(this.path, json);
  }

  add(tape: Tape) {
    this.tapes.push(tape);
    this.save();
  }

  find(request: Request) {
    const { tapes } = this;

    const foundTape = tapes.find((t) => {
      this.context.logger.debug(`Comparing against tape ${t.meta.path}`);

      return new TapeMatcher(t, this.context).matches(request);
    });

    if (foundTape) {
      foundTape.meta.used = true;
      this.context.logger.log(`Found matching tape for ${request.url} at ${foundTape.meta.path}`);

      return foundTape;
    }

    return null;
  }

  matchesPath(pathToMatch: string) {
    return this.path === path.normalize(pathToMatch);
  }
}
