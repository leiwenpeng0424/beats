import { type IPackageJson } from "@nfts/pkg-json";
import { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import { RollupEslintOptions } from "@rollup/plugin-eslint";
import { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import { Plugin, type ModuleFormat, type RollupOptions } from "rollup";
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
};
export interface Config {
    /**
     * Entry file for all bundle output. If you are not specified in bundle item.
     * this would be the default input.
     */
    input?: string | string[] | Record<string, string>;
    /**
     * Should generate .d.ts file for bundle.
     */
    dtsRollup?: boolean;
    /**
     * Dependencies should be exclude during bundle.
     */
    externals?: string[];
    /**
     * esbuild options.
     */
    esbuild?: TRollupTransformOptions;
    eslint?: RollupEslintOptions & {
        /**
         * Disable use of configuration from .eslintrc.*
         */
        noEslintrc?: boolean;
    };
    commonjs?: RollupCommonJSOptions;
    nodeResolve?: RollupNodeResolveOptions;
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
