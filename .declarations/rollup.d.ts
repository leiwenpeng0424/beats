import { type Plugin, type RollupOptions, type RollupOutput, type RollupWatchOptions } from "rollup";
import { IPackageJson } from "@nfts/pkg-json";
export declare const EXTENSIONS: string[];
/**
 *
 * @desc Externals function for rollup.externals,
 * by default, all devDependencies and dependencies in package.json
 * will be ignored.
 *
 */
export declare const externalsGenerator: (externals: string[] | undefined, pkgJson: IPackageJson) => (id: string) => boolean;
/**
 *
 * Default plugins.
 *
 *
 **/
export declare const applyPlugins: (extraPlugins?: Plugin[], options?: {
    sourcemap?: boolean;
}) => Plugin[];
export type TBundleOutput = {
    /**
     * Duration time.(ms)
     */
    duration: number;
    input: string | string[];
} & RollupOutput;
/**
 *
 * Get all bundle tasks.
 *
 */
export declare const bundle: (options: RollupOptions | RollupOptions[]) => Promise<(() => Promise<TBundleOutput>)[]>;
/**
 *
 * Dev process
 *
 */
export declare const watch_: (options: RollupWatchOptions | RollupWatchOptions[]) => Promise<void>;
