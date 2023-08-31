'use strict';

var path = require('node:path');

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

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
const aliasToModulePath = (alias2 = {}) => {
  const aliasLen = Object.keys(alias2).length;
  return (id) => {
    if (aliasLen === 0) {
      return null;
    }
    for (const key in alias2) {
      if (Object.prototype.hasOwnProperty.call(alias2, key)) {
        const element = alias2[key];
        if (element.length === 0) {
          return null;
        }
        if (key === id) {
          return element[0];
        }
        const regexp = new RegExp(
          `${key.replace("/*", "/(.+)$")}`
        ).exec(id);
        if (regexp) {
          const subpath = regexp[1];
          return element[0].replace("*", subpath);
        }
      }
    }
    return "";
  };
};
function alias({ alias: alias2 }) {
  const resolve = aliasToModulePath(alias2);
  return {
    name: "alias",
    resolveId: {
      order: "pre",
      handler(id, importer) {
        return __async(this, null, function* () {
          const moduleId = resolve(id);
          if (moduleId) {
            const resolution = yield this.resolve(
              path__namespace.resolve(process.cwd(), moduleId),
              importer,
              {
                skipSelf: true
              }
            );
            return resolution;
          }
          return null;
        });
      }
    }
  };
}

exports.alias = alias;
exports.aliasToModulePath = aliasToModulePath;
//# sourceMappingURL=index.cjs.map
