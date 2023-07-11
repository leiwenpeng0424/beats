import { type IPackageJson } from "@nfts/pkg-json";
import { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import { RollupEslintOptions } from "@rollup/plugin-eslint";
import { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import { type ModuleFormat, Plugin, type RollupOptions } from "rollup";
import { type TRollupTransformOptions } from "./plugins/esbuild.plugin";
export type TBundleConfig = {
    input?: RollupOptions["input"];
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
    /**
     * Entry file for all bundle output. If you are not specified in bundle item.
     * this would be the default input.
     */
    input?: string | string[] | {
        [K: string]: string;
    };
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
    project?: string;
    /**
     * Print more info in terminal during bundle.
     */
    verbose?: boolean;
    watch?: boolean;
    /**
     * Cleanup before output write.
     */
    clean?: boolean;
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
    rollup?: Omit<RollupOptions, "plugins" | "output" | "input">;
    /**
     * Output options.
     */
    bundle?: TBundleConfig[];
}
export declare const tryReadConfigFromRoot: ({ configPath, pkgJson, }: {
    configPath?: string | undefined;
    pkgJson: IPackageJson;
}) => Promise<Config>;
