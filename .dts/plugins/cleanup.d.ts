import { type Plugin } from "rollup";
export interface RollupCleanupOptions {
    active?: boolean;
}
/**
 * cleanup output dir.
 * @param active
 */
export default function cleanup({ active }?: RollupCleanupOptions): Plugin;
