const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");
const mkdirp = require("mkdirp");

import Tape from "./tape";
import TapeStore from "./tape-store";
import TapeMatcher from "./tape-matcher";
import TapeRenderer from "./tape-renderer";

export default class TapeStoreManager {
  constructor(options) {
    this.options = options;
    this.tapeStores = [];

    if (this.options.path) {
      this.defaultTapeStore = new TapeStore(options);
      this.tapeStores.push(this.defaultTapeStore);
    }
  }

  getTapeStore(tape) {
    if (tape && this.options.tapePathGenerator) {
      const path = this.options.tapePathGenerator(tape);

      if (path) {
        let tapeStore = this.findTapeStore(path);

        if (tapeStore) {
          return tapeStore;
        }

        tapeStore = new TapeStore({
          ...this.options,
          path
        });

        this.tapeStores.push(tapeStore);

        return tapeStore;
      }
    }

    if (this.options.path) {
      return this.defaultTapeStore;
    }

    throw new Error(
      "Cant find path for tape store, use options.path or options.tapePathGenerator"
    );
  }

  findTapeStore(path) {
    return this.tapeStores.find(tapeStore => tapeStore.hasPath(path));
  }

  hasTapeBeenUsed(tapeName) {
    return this.tapeStores.some(tapeStore =>
      tapeStore.hasTapeBeenUsed(tapeName)
    );
  }

  resetTapeUsage(path) {
    if (!path) {
      return this.tapeStores.forEach(tapeStore => tapeStore.resetTapeUsage());
    }
    return this.findTapeStore(path).resetTapeUsage();
  }

  getAllTapes() {
    return this.tapeStores.reduce(
      (tapes, tapeStore) => [...tapes, tapeStore.tapes],
      []
    );
  }
}
