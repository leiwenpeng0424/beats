/**
 * @TBD
 */
import { type Plugin } from "rollup";
export interface RollupCleanupOptions {
    active?: boolean;
}
export default function cleanup({ active }?: RollupCleanupOptions): Plugin;
