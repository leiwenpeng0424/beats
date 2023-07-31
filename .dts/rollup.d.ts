import { type Config, type TRollupOptions } from "@/configuration";
import { RollupCleanupOptions } from "@/plugins/cleanup";
import { type IPackageJson } from "@nfts/pkg-json";
import { type ITSConfigJson } from "@nfts/tsc-json";
import { type RollupOutput, type RollupWatchOptions } from "rollup";
import alias, { RollupAliasOptions } from "@/plugins/alias";
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
 * Default plugins.
 **/
export declare const applyPlugins: (options?: Pick<Config, "eslint" | "nodeResolve" | "commonjs" | "esbuild" | "clean" | "styles"> & {
    clean?: RollupCleanupOptions;
    alias?: RollupAliasOptions;
}) => import("rollup").Plugin[];
export type TBundleOutput = {
    duration: number;
    input: string;
} | RollupOutput;
/**
 *
 * Get all bundle tasks.
 *
 */
export declare const bundle: (options: TRollupOptions | TRollupOptions[], config: Config, pkgJson: IPackageJson) => Promise<(() => Promise<TBundleOutput>)[]>;
/**
 *
 * Dev process
 *
 */
export declare const watch_: (options: RollupWatchOptions | RollupWatchOptions[], { bundleEnd, bundleStart, start, end, error, }?: {
    bundleEnd?: (() => void) | undefined;
    bundleStart?: (() => void) | undefined;
    start?: (() => void) | undefined;
    end?: (() => Promise<void>) | undefined;
    error?: (() => void) | undefined;
}) => Promise<void>;
/**
 * Start rollup bundle process.
 * @param config
 * @param pkgJson
 * @param tsConfig
 */
export declare function startRollupBundle({ config, pkgJson, tsConfig, }: {
    config: Config;
    pkgJson: IPackageJson;
    tsConfig: ITSConfigJson;
}): Promise<void>;
