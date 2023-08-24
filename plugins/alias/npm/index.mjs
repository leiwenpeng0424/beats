import * as path from 'node:path';

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
      async handler(id, importer) {
        const moduleId = resolve(id);
        if (moduleId) {
          const resolution = await this.resolve(
            path.resolve(process.cwd(), moduleId),
            importer,
            {
              skipSelf: true
            }
          );
          return resolution;
        }
        return null;
      }
    }
  };
}

export { alias, aliasToModulePath };
//# sourceMappingURL=index.mjs.map
