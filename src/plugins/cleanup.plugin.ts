/**
 * @TBD
 */
import { type Plugin } from "rollup";
import nodePath from "node:path";
import { cwd } from "../utils";
import nodeFs from "node:fs/promises";

export interface RollupCleanupOptions {
    active?: boolean;
}

export default function cleanup(
    { active }: RollupCleanupOptions = { active: true },
): Plugin {
    return {
        name: "rmdir",
        version: "0.0.1",
        async generateBundle(output, _, isWrite) {
            if (active && !isWrite) {
                if (output.file) {
                    const absPath = nodePath.join(cwd(), output.file);
                    console.log(absPath);
                    try {
                        await nodeFs.access(absPath);
                        await nodeFs.unlink(absPath);
                    } catch (e) {
                        //
                    }

                    const sourcemapFile =
                        output.sourcemapFile ?? absPath + ".map";

                    try {
                        await nodeFs.access(sourcemapFile);
                        await nodeFs.unlink(sourcemapFile);
                    } catch (e) {
                        //
                    }
                }
            }
        },
    };
}
