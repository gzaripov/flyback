import fs from 'fs';
import path from 'path';
import Tape, { TapeJson } from './tape';
import { Request, Response } from './http';
import { Context } from './options';
import formatJson from './utils/format-json';

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
      const jsonTapes: TapeJson[] = JSON.parse(fileText);

      this.tapes = jsonTapes.map((tapeJson) => Tape.fromJSON(tapeJson, this.context));
    } catch (e) {
      throw new Error(`Error reading tape ${this.path}\n${e.toString()}`);
    }
  }

  save() {
    const tapeGroups = this.tapes.reduce(
      (groups, tape) => {
        const ext = this.context.tapeExtension;
        const tapeFilePath = tape.name.endsWith(`.${ext}`) ? tape.name : `${tape.name}.${ext}`;

        const group = groups[tapeFilePath] || [];

        return {
          ...groups,
          [tapeFilePath]: [...group, tape.toJSON()],
        };
      },
      {} as { [tapeFilePath: string]: TapeJson[] },
    );

    Object.keys(tapeGroups).forEach((tapePath) => {
      fs.writeFileSync(tapePath, formatJson(tapeGroups[tapePath]));
    });
  }

  add(tape: Tape) {
    this.tapes.push(tape);
    this.save();
  }

  find(request: Request): Response | null {
    const { tapes } = this;

    const foundTape = tapes.find((tape) => {
      // this.context.logger.debug(`Comparing against tape ${t.meta.path}`);

      if (this.context.tapeMatcher) {
        return this.context.tapeMatcher(tape.toJSON(), request.toJSON());
      }

      return tape.request.equals(request);
    });

    if (foundTape) {
      // TODO:
      // foundTape.meta.used = true;
      // this.context.logger.log(`Found matching tape for ${request.url} at ${foundTape.meta.path}`);

      return foundTape.response;
    }

    return null;
  }

  matchesPath(pathToMatch: string) {
    return this.path === path.normalize(pathToMatch);
  }
}
