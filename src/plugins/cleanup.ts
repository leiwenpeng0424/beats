/**
 * @TBD
 */
import { type Plugin } from "rollup";
import nodePath from "node:path";
import { cwd } from "@/utils";
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
                    const absDir = nodePath.dirname(absPath);
                    try {
                        await nodeFs.access(absDir);
                        await nodeFs.rmdir(absDir, { maxRetries: 10 });
                    } catch (e) {
                        //
                    }
                }
            }
        },
    };
}
