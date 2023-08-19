import { Plugin as Plugin_2 } from 'rollup';

/**
 * cleanup output dir.
 * @param active
 */
declare function cleanup({ active }?: RollupCleanupOptions): Plugin_2;
export default cleanup;

export declare interface RollupCleanupOptions {
    active?: boolean;
}

export { }
