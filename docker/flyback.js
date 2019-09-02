const FLYBACK_CONFIG = process.env.FLYBACK_CONFIG || './flyback-config';

const config = require(FLYBACK_CONFIG);

if (!config) {
  throw new Error(`Configuration in ${FLYBACK_CONFIG} is empty`);
}

const flyback = require('flyback');

flyback.createFlybackServer(config).start();
