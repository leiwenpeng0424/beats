import { type Plugin } from "rollup";
import type { IPathObject } from "@nfts/tsc-json";
import nodePath from "node:path";
import { cwd } from "@/utils";

export type RollupAliasOptions = { alias: IPathObject };

export default function alias({ alias }: RollupAliasOptions): Plugin {
    const aliaNames = Object.keys(alias);

    return {
        name: "alias",
        resolveId: {
            order: "pre",
            async handler(id, importer) {
                if (aliaNames.length === 0) return null;

                const aliaNamesMatched = aliaNames.filter((name) =>
                    id.startsWith(name.replace(/\*/g, "")),
                );

                if (aliaNamesMatched.length === 0) return null;

                const matchedPathName = aliaNamesMatched[0];
                const matchedPathAlias = alias[matchedPathName];

                let resolution;

                for await (const path of matchedPathAlias) {
                    const pathStripStar = path.replace(/\*/g, "");
                    const matchedPathNameStripStar = matchedPathName.replace(
                        /\*/g,
                        "",
                    );

                    const realId = nodePath.join(
                        cwd(),
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
