const semver = require('semver');

require('./linker.js');
require('./translate.js');
require('./package.js');
require('./abi.js');
require('./determinism.js');

// The CLI doesn't support Node 4
if (semver.gte(process.version, '5.0.0')) {
  require('./cli.js');
}
