import * as path from 'node:path';

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
        const regexp = new RegExp(`${key.replace("*", "(.+)$")}`).exec(
          id
        );
        if (regexp) {
          const subpath = regexp[1];
          return element[0].replace("*", subpath);
        }
      }
    }
    return null;
  };
};
function alias({ alias: alias2 }) {
  const resolve = aliasToModulePath(alias2);
  return {
    name: "alias",
    resolveId: {
      handler(id, importer) {
        return __async(this, null, function* () {
          const moduleId = resolve(id);
          if (moduleId) {
            const resolution = yield this.resolve(
              path.resolve(process.cwd(), moduleId),
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

export { alias, aliasToModulePath };
