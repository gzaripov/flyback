import { parseUrl } from "../../src/utils/url";

describe("Url parser", () => {
  it("parses url", () => {
    const { host, port } = parseUrl("http://localhost:8898/");
    expect(host).to.eql("localhost");
    expect(port).to.eql(8898);
  });

  it("takes port from protocol if port not specified", () => {
    const { port: httpPort } = parseUrl("http://localhost");
    const { port: httpsPort } = parseUrl("https://localhost");

    expect(httpPort).to.eql(80);
    expect(httpsPort).to.eql(443);
  });

  it("throws error when cant find port", () => {
    const url = "git://localhost";
    expect(() => parseUrl(url)).to.throw(`Cant find port in url ${url}`);
  });
});
