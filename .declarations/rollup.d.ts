import { IPackageJson } from "@nfts/pkg-json";
import { type Plugin, type RollupOptions, type RollupOutput, type RollupWatchOptions } from "rollup";
import { type Config } from "./configuration";
import binGen, { RollupBinGenOptions } from "./plugins/binGen.plugin";
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
export declare const applyPlugins: (extraPlugins?: Plugin[], options?: Pick<Config, "eslint" | "nodeResolve" | "commonjs" | "esbuild" | "styles"> & {
    binGen?: RollupBinGenOptions;
}) => (Plugin | undefined)[];
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
