'use strict';

var nodePath = require('node:path');

var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
function alias({ alias: alias2 }) {
  const aliasNames = Object.keys(alias2);
  return {
    name: "alias",
    resolveId: {
      order: "pre",
      async handler(id, importer) {
        if (aliasNames.length === 0)
          return null;
        const aliasNamesMatched = aliasNames.filter(
          (name) => id.startsWith(name.replace(/\*/g, ""))
        );
        if (aliasNamesMatched.length === 0)
          return null;
        const matchedPathName = aliasNamesMatched[0];
        const matchedPathAlias = alias2[matchedPathName];
        let resolution;
        try {
          for (var iter = __forAwait(matchedPathAlias), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
            const path = temp.value;
            const pathStripStar = path.replace(/\*/g, "");
            const matchedPathNameStripStar = matchedPathName.replace(
              /\*/g,
              ""
            );
            const realId = nodePath.join(
              process.cwd(),
              `./${id.replace(
                matchedPathNameStripStar,
                pathStripStar
              )}`
            );
            resolution = await this.resolve(realId, importer, {
              skipSelf: true
            });
            if (resolution) {
              break;
            }
          }
        } catch (temp) {
          error = [temp];
        } finally {
          try {
            more && (temp = iter.return) && await temp.call(iter);
          } finally {
            if (error)
              throw error[0];
          }
        }
        return resolution;
      }
    }
  };
}

module.exports = alias;
