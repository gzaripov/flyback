const url = require("url");

export function parseUrl(siteUrl) {
  const urlObj = url.parse(siteUrl);
  return {
    host: urlObj.hostname,
    port: urlObj.port
  };
}
