import { type Plugin } from "rollup";
import { file } from "@nfts/nodeutils";

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
                console.log(`Removing ${file.normalize(dir)}`);
                file.rmdirSync(file.normalize(dir));
                removed = true;
            },
        },
    };
}
