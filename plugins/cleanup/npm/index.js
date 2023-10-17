'use strict';

var nodeutils = require('@nfts/nodeutils');
var nodeFs = require('node:fs');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var nodeFs__namespace = /*#__PURE__*/_interopNamespaceDefault(nodeFs);

function cleanup({ dir } = { dir: "./npm" }) {
  let removed = false;
  return {
    name: "rmdir",
    generateBundle: {
      handler() {
        if (removed)
          return;
        const realPath = nodeutils.file.normalize(dir);
        if (nodeFs__namespace.existsSync(realPath)) {
          nodeutils.file.rmdirSync(realPath);
          removed = true;
        }
      }
    }
  };
}

exports.cleanup = cleanup;
