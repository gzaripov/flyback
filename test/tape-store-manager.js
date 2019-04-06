import path from "path";
import TapeStoreManager from "../src/tape-store-manager";
import TapeRenderer from "../src/tape-renderer";
import Options from "../src/options";

const raw = {
  meta: {
    createdAt: new Date(),
    reqHumanReadable: true,
    resHumanReadable: false
  },
  req: {
    url: "/foo/bar/1?real=3",
    method: "GET",
    headers: {
      accept: "text/unknown",
      "content-type": "text/plain",
      testpath: path.normalize(path.join(__dirname, "tapes") + "/")
    },
    body: "ABC"
  },
  res: {
    status: 200,
    headers: {
      "content-type": ["text/unknown"],
      "x-ignored": ["2"]
    },
    body: Buffer.from("Hello").toString("base64")
  }
};

describe("TapeStoreManager", () => {
  it("returns store with path from tapePathGenerator", () => {
    const opts = Options.prepare({
      tapePathGenerator: tape => {
        return tape.req.headers.testpath;
      }
    });

    const tape = TapeRenderer.fromStore(raw, opts);
    const tapeStoreManager = new TapeStoreManager(opts);

    const tapeStore = tapeStoreManager.getTapeStore(tape);

    expect(tapeStore.path).to.eq(raw.req.headers.testpath);
  });
});
