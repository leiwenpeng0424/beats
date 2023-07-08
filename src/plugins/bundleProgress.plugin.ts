import { colors } from "@nfts/utils";
import { type OutputChunk, type Plugin } from "rollup";
import nodePath from "node:path";
import { cwd } from "../utils";

export type BundleStatus = {
    loaded: number;
    parsed: number;
};

export default function bundleProgress(): Plugin {
    let cur: string;
    const bundlesStatus: { [K: string]: BundleStatus } = {};

    return {
        name: "bin",
        resolveId(id, importer, { isEntry }) {
            if (isEntry && !importer && nodePath.isAbsolute(id)) {
                cur = id;
                bundlesStatus[id] = {
                    loaded: 0,
                    parsed: 0,
                };
            }
        },

        load() {
            if (bundlesStatus[cur]) {
                bundlesStatus[cur].loaded += 1;
            }
        },

        moduleParsed(moduleInfo) {
            const status = bundlesStatus[cur];
            if (status) {
                status.parsed += 1;
                if (process.stdout.isTTY) {
                    const relativeModulePath = nodePath.relative(
                        cwd(),
                        moduleInfo.id,
                    );
                    const output = `[ModuleParse] (${status.parsed}/${status.loaded}) ${relativeModulePath}`;
                    process.stdout.cursorTo(0);
                    process.stdout.write(output);
                }
            }
        },

        generateBundle(options, bundle, isWrite) {
            if (process.stdout.isTTY) {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
            }
        },

        async writeBundle(output, bundle) {
            const files = Object.keys(bundle);
            for (const file of files) {
                const { facadeModuleId } = bundle[file] as OutputChunk;
                facadeModuleId &&
                    console.log(
                        colors.bgGreen(
                            colors.bold(
                                colors.black(
                                    nodePath.relative(cwd(), facadeModuleId),
                                ),
                            ),
                        ),
                        "➡︎",
                        colors.cyan(file),
                    );
            }
        },
    };
}
