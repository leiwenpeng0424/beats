import { type IPathObject } from "@nfts/tsc-json";
import { type Plugin } from "rollup";
import * as path from "node:path";

export type RollupAliasOptions = { alias: IPathObject };

/**
 * Map alias to realpath.
 * @param alias
 * @returns
 */
export const aliasToModulePath = (alias: IPathObject = {}) => {
    const aliasLen = Object.keys(alias).length;

    return (id: string): string | null => {
        if (aliasLen === 0) {
            return null;
        }

        for (const key in alias) {
            if (Object.prototype.hasOwnProperty.call(alias, key)) {
                const element = alias[key];

                if (element.length === 0) {
                    return null;
                }

                if (key === id) {
                    return element[0];
                }

                const regexp = new RegExp(`${key.replace("*", "(.+)$")}`).exec(
                    id,
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

/**
 * ts-config paths to alias.
 * This plugin need to be the first one of the rollup plugin array.
 * @param alias
 */
export function alias({ alias }: RollupAliasOptions): Plugin {
    const resolve = aliasToModulePath(alias);

    return {
        name: "alias",
        resolveId: {
            async handler(id, importer) {
                const moduleId = resolve(id);

                if (moduleId) {
                    const resolution = await this.resolve(
                        path.resolve(process.cwd(), moduleId),
                        importer,
                        {
                            skipSelf: true,
                        },
                    );

                    return resolution;
                }
                return null;
            },
        },
    };
}
