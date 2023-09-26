'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var nodePath = require('node:path');

function bundleProgress() {
  let cur;
  const bundlesStatus = {};
  return {
    name: "bin",
    resolveId(id, importer, { isEntry }) {
      if (isEntry && !importer && nodePath.isAbsolute(id)) {
        cur = id;
        bundlesStatus[id] = {
          loaded: 0,
          parsed: 0
        };
      }
    },
    load() {
      if (bundlesStatus[cur]) {
        bundlesStatus[cur].loaded += 1;
      }
    },
    moduleParsed(moduleInfo) {
      const status = bundlesStatus[cur];
      if (status) {
        status.parsed += 1;
        if (process.stdout.isTTY) {
          const relativeModulePath = nodePath.relative(
            process.cwd(),
            moduleInfo.id
          );
          const output = `(${status.parsed}/${status.loaded}) ${relativeModulePath}`;
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(
            output.length > process.stdout.columns ? output.slice(0, process.stdout.columns - 1) : output
          );
        }
      }
    },
    generateBundle() {
      if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
      }
    }
  };
}

exports.default = bundleProgress;
//# sourceMappingURL=index.cjs.map
