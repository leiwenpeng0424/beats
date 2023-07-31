import { type TRollupTransformOptions } from "@/plugins/esbuild";
import { type IPackageJson } from "@nfts/pkg-json";
import { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import { RollupEslintOptions } from "@rollup/plugin-eslint";
import { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import { Plugin, type ModuleFormat, type RollupOptions } from "rollup";
export type TBundleConfig = {
    input?: string;
    dir?: string;
    file?: string;
    format?: ModuleFormat;
    globals?: string[];
    plugins?: Plugin[];
    paths?: {
        [K: string]: string;
    };
    sourcemap?: boolean | "inline" | "hidden";
};
export interface CLIOptions {
    [K: string]: any;
    /**
     * Entry file for all bundle output. If you are not specified in bundle item.
     * this would be the default input.
     */
    input?: string;
    /**
     * Should generate .d.ts file for bundle.
     */
    dtsRollup?: boolean;
    /**
     * Generate .map file for bundle output.
     */
    sourcemap?: boolean | "inline" | "hidden";
    /**
     * Specified beats config file path.
     */
    config?: string;
    /**
     * tsconfig file path.
     */
    project?: string;
    /**
     * Print more info in terminal during bundle.
     */
    verbose?: boolean;
    /**
     * Watch mode.
     */
    watch?: boolean;
    /**
     * Cleanup before output write.
     */
    clean?: boolean;
    /**
     * Confound bundle code.
     */
    minify?: boolean;
    /**
     * Show internal debug info.
     */
    debug?: boolean;
}
export interface Config extends CLIOptions {
    /**
     * Dependencies should be exclude during bundle.
     */
    externals?: string[];
    /**
     * esbuild options.
     */
    esbuild?: TRollupTransformOptions;
    /**
     * eslint options.
     */
    eslint?: RollupEslintOptions & {
        /**
         * Disable use of configuration from .eslintrc.*
         */
        noEslintrc?: boolean;
    };
    commonjs?: RollupCommonJSOptions;
    nodeResolve?: RollupNodeResolveOptions;
    /**
     * TODO:
     *  rollup-plugin-styles is no longer actively update,
     *  Try to replace rollup-plugin-styles with new plugin.
     */
    styles?: any;
    /**
     * Extra rollup options.
     */
    rollup?: Exclude<TRollupOptions, "output" | "input">;
    /**
     * Output options.
     */
    bundle?: TBundleConfig[];
    /**
     * Overwrite bundle config
     */
    bundleOverwrite?: (b: TBundleConfig) => TBundleConfig;
}
export type TRollupOptions = Omit<RollupOptions, "input"> & {
    input: string;
};
/**
 * Configuration define helper.
 * @param options
 */
export declare function defineConfig(options: Config): Config;
/**
 * Read config from project.
 * @param configPath
 * @param pkgJson
 */
export declare function tryReadConfig({ configPath, pkgJson, }: {
    configPath?: string;
    pkgJson: IPackageJson;
}): Promise<Config>;
