const package = require('./package.json');

module.exports = {
  templates: `${__dirname}/_templates`,
  helpers: {
    currentVersion: package.version,
  },
};
