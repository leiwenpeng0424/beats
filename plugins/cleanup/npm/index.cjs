'use strict';

var nodeutils = require('@nfts/nodeutils');

function cleanup({ dir } = { dir: "./npm" }) {
  let removed = false;
  return {
    name: "rmdir",
    generateBundle: {
      handler() {
        if (removed)
          return;
        console.log(`Removing ${nodeutils.file.normalize(dir)}`);
        nodeutils.file.rmdirSync(nodeutils.file.normalize(dir));
        removed = true;
      }
    }
  };
}

exports.cleanup = cleanup;
