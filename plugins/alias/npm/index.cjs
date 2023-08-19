'use strict';

var nodePath = require('node:path');

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
        for await (const path of matchedPathAlias) {
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
        return resolution;
      }
    }
  };
}

module.exports = alias;
