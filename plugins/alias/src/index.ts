import { type Plugin } from "rollup";
import { type IPathObject } from "@nfts/tsc-json";
import nodePath from "node:path";

export type RollupAliasOptions = { alias: IPathObject };

/**
 * tsconfig paths to alias.
 * this plugin need to be the first one of the rollup plugin array.
 * @param alias
 */
export default function alias({ alias }: RollupAliasOptions): Plugin {
    const aliasNames = Object.keys(alias);

    return {
        name: "alias",
        resolveId: {
            order: "pre",
            async handler(id, importer) {
                if (aliasNames.length === 0) return null;

                const aliasNamesMatched = aliasNames.filter((name) =>
                    id.startsWith(name.replace(/\*/g, "")),
                );

                if (aliasNamesMatched.length === 0) return null;

                const matchedPathName = aliasNamesMatched[0];
                const matchedPathAlias = alias[matchedPathName];

                let resolution;

                for await (const path of matchedPathAlias) {
                    const pathStripStar = path.replace(/\*/g, "");
                    const matchedPathNameStripStar = matchedPathName.replace(
                        /\*/g,
                        "",
                    );

                    const realId = nodePath.join(
                        process.cwd(),
                        `./${id.replace(
                            matchedPathNameStripStar,
                            pathStripStar,
                        )}`,
                    );

                    resolution = await this.resolve(realId, importer, {
                        skipSelf: true,
                    });

                    if (resolution) {
                        break;
                    }
                }

                return resolution;
            },
        },
    };
}

