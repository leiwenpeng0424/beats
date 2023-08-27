import { type Plugin } from "rollup";
import { file } from "@nfts/nodeutils";
import * as nodeFs from "node:fs";

export interface RollupCleanupOptions {
    dir: string;
}

/**
 * cleanup output dir.
 * @param active
 */
export function cleanup(
    { dir }: RollupCleanupOptions = { dir: "./npm" },
): Plugin {
    let removed = false;

    return {
        name: "rmdir",
        generateBundle: {
            handler() {
                if (removed) return;
                const realPath = file.normalize(dir);
                if (nodeFs.existsSync(realPath)) {
                    file.rmdirSync(realPath);
                    removed = true;
                }
            },
        },
    };
}

