import nodePath from 'node:path';

var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
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
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
function alias({ alias: alias2 }) {
  const aliasNames = Object.keys(alias2);
  return {
    name: "alias",
    resolveId: {
      order: "pre",
      handler(id, importer) {
        return __async(this, null, function* () {
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
            for (var iter = __forAwait(matchedPathAlias), more, temp, error; more = !(temp = yield iter.next()).done; more = false) {
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
              resolution = yield this.resolve(realId, importer, {
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
              more && (temp = iter.return) && (yield temp.call(iter));
            } finally {
              if (error)
                throw error[0];
            }
          }
          return resolution;
        });
      }
    }
  };
}

export { alias as default };
