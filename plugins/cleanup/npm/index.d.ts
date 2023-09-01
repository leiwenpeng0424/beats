import { Plugin as Plugin_2 } from 'rollup';

/**
 * cleanup output dir.
 * @param active
 */
export declare function cleanup({ dir }?: RollupCleanupOptions): Plugin_2;

export declare interface RollupCleanupOptions {
    dir: string;
}

export { }
