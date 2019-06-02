import fs from 'fs';
import path from 'path';
import Tape, { TapeJson } from './tape';
import { Request } from './http';
import { Context } from './context';
import formatJson from './utils/format-json';

export default class TapeFile {
  public readonly name: string;
  private readonly path: string;
  private readonly tapes: Set<Tape>;
  private readonly context: Context;

  constructor(filePath: string, context: Context, tapes: Tape[] = []) {
    this.context = context;
    this.path = this.normalizePath(filePath);
    this.tapes = new Set(tapes);

    if (fs.existsSync(filePath)) {
      this.load();
    }

    this.name = this.createName();
  }

  private normalizePath(path: string) {
    const ext = this.context.tapeExtension;

    return path.endsWith(`.${ext}`) ? path : `${path}.${ext}`;
  }

  private createName() {
    if (this.tapes.size > 0) {
      return this.tapes.values().next().value.name;
    } else {
      return path.basename(this.path);
    }
  }

  getAllTapes() {
    return this.tapes;
  }

  private load() {
    try {
      const fileText = fs.readFileSync(this.path, 'utf8');
      const fileJson = JSON.parse(fileText);
      const jsonTapes: TapeJson[] = Array.isArray(fileJson) ? fileJson : [fileJson];

      jsonTapes.forEach((tapeJson) => {
        const tape = Tape.fromJSON(tapeJson, this.context);

        this.tapes.add(tape);
      });
    } catch (e) {
      throw new Error(`Error reading tape ${this.path}\n${e.toString()}`);
    }
  }

  save() {
    const jsonTapes = [...this.tapes].map((tape) => tape.toJSON());
    const paths = jsonTapes.map((tape) => `${'\n -'}${tape.request.path}`);

    this.context.logger.log(
      `Saving tape file${jsonTapes.length > 1 ? 's' : ''} ${paths}\n at ${this.path}`,
    );

    const resultJson = jsonTapes.length > 1 ? jsonTapes : jsonTapes[0];

    fs.writeFileSync(this.path, formatJson(resultJson));
  }

  add(tape: Tape) {
    this.tapes.add(tape);
  }

  delete(tape: Tape) {
    this.tapes.delete(tape);
  }

  find(request: Request): Tape | null {
    const foundTape = [...this.tapes].find((tape) => {
      if (this.context.tapeMatcher) {
        return this.context.tapeMatcher(tape.toJSON(), request.toJSON());
      }

      return tape.containsRequest(request);
    });

    if (foundTape) {
      this.context.logger.log(`Found matching tape for ${request.fullPath} at ${this.path}`);
      this.context.tapeAnalyzer.markUsed(foundTape);

      return foundTape;
    }

    return null;
  }

  matchesPath(pathToMatch: string) {
    return this.path === path.normalize(pathToMatch);
  }
}
