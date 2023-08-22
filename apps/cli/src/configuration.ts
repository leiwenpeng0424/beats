import * as CONSTANTS from "@/constants";
import { module_ } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import type { TRollupTransformOptions } from "@nfts/plugin-esbuild";
import type { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import type { RollupEslintOptions } from "@rollup/plugin-eslint";
import type { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import nodeFs from "node:fs/promises";
import nodePath from "node:path";
import type { ModuleFormat, Plugin, RollupOptions } from "rollup";

/**
 * Return output format.
 * @param output
 */
function getFormatFromFileName(output: string): ModuleFormat {
    const ext = nodePath.extname(output);

    if (CONSTANTS.esmExt.includes(ext) || output.endsWith(".d.ts")) {
        return "es";
    }

    if (CONSTANTS.cjsExt.includes(ext)) {
        return "cjs";
    }

    if (CONSTANTS.esmMiddleNames.some((name) => output.includes(name))) {
        return "es";
    }

    if (CONSTANTS.cjsMiddleNames.some((name) => output.includes(name))) {
        return "cjs";
    }

    return "cjs";
}

/**
 * Get outputs from package.json
 * @param pkgJson
 * @param externalOutputOptions
 */
function getOutputFromPackageJson(
    pkgJson: IPackageJson,
    externalOutputOptions: (opt: TBundleConfig) => TBundleConfig = (o) => o,
): TBundleConfig[] {
    const { main, module: m } = pkgJson;
    return (
        [main, m]
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .filter<string>(Boolean)
            .map((output) => {
                const format = getFormatFromFileName(output);

                // dot mark fallback to ./index.js
                if (output === ".") {
                    output = CONSTANTS.output;
                }

                return externalOutputOptions({
                    format,
                    file: output,
                });
            })
    );
}

/**
 * Default config.
 */
const Configs = ["beats.config.js", "beats.config.ts", "beats.config.json"];

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
    // eslint-disable-next-line
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export function defineConfig(options: Config) {
    return options;
}

/**
 * Read config from project.
 * @param configPath
 * @param pkgJson
 */
export async function tryReadConfig({
    configPath,
    pkgJson,
}: {
    configPath?: string;
    pkgJson: IPackageJson;
}): Promise<Config> {
    const _cwd = process.cwd();

    let config: Config;

    if (!configPath) {
        for await (const configFile of Configs) {
            try {
                const configFilePath = nodePath.join(_cwd, configFile);
                await nodeFs.access(configFilePath);
                configPath = configFilePath;
                break;
            } catch (e: unknown) {
                // TODO: Skip error
            }
        }
    }

    if (configPath) {
        config = module_.import_<Config>(configPath);

        if (!config.bundle) {
            Object.assign(config, {
                bundle: getOutputFromPackageJson(
                    pkgJson,
                    config.bundleOverwrite,
                ),
            });
        }

        if (pkgJson.types) {
            Object.assign(config, { dtsRollup: true });
        }

        return config;
    } else {
        return {
            dtsRollup: !!pkgJson.types,
            bundle: getOutputFromPackageJson(pkgJson),
        };
    }
}
