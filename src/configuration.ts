import { type IPackageJson } from "@nfts/pkg-json";
import { modulex } from "@nfts/utils";
import { RollupCommonJSOptions } from "@rollup/plugin-commonjs";
import { RollupEslintOptions } from "@rollup/plugin-eslint";
import { RollupNodeResolveOptions } from "@rollup/plugin-node-resolve";
import nodeFs from "node:fs/promises";
import nodePath from "node:path";
import { Plugin, type ModuleFormat, type RollupOptions } from "rollup";
import { type TRollupTransformOptions } from "./plugins/esbuild.plugin";
import { cwd } from "./utils";

const esmExt = [".mjs", ".mts"];
const cjsExt = [".cjs", ".cts"];

const esmMiddleNames = [".esm.", ".es."];
const cjsMiddleNames = [".cjs."];

const getFormatFromFileName = (output: string): ModuleFormat => {
    const ext = nodePath.extname(output);

    if (esmExt.includes(ext) || output.endsWith(".d.ts")) {
        return "es";
    }

    if (cjsExt.includes(ext)) {
        return "cjs";
    }

    if (esmMiddleNames.some((name) => output.includes(name))) {
        return "es";
    }

    if (cjsMiddleNames.some((name) => output.includes(name))) {
        return "cjs";
    }

    return "cjs";
};

const getOutputFromPackageJson = (
    pkgJson: IPackageJson,
    rollupInput: RollupOptions["input"],
    externalOutputOptions: (opt: TBundleConfig) => TBundleConfig = (o) => o,
): TBundleConfig[] => {
    const { main, module: m } = pkgJson;
    return (
        [main, m]
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .filter<string>(Boolean)
            .map((output) => {
                const format = getFormatFromFileName(output);

                // dot fallback to ./index.js
                if (output === ".") {
                    output = "./index.js";
                }

                return externalOutputOptions({
                    format,
                    file: output,
                    input: rollupInput,
                });
            })
    );
};

const Configs = ["beats.config.js", "beats.config.ts", "beats.config.json"];

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
    sourcemap?: boolean;
};

export interface Config {
    /**
     * Entry file for all bundle output. If you are not specified in bundle item.
     * this would be the default input.
     */
    input?: string | string[] | { [K: string]: string };

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const defaultInputPath = "./src/index";

export const tryReadConfigFromRoot = async ({
    configPath,
    pkgJson,
}: {
    configPath?: string;
    pkgJson: IPackageJson;
}): Promise<Config> => {
    const _cwd = cwd();

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
        config = modulex.import_<Config>(configPath);

        if (!config.input) {
            Object.assign(config, { input: defaultInputPath });
        }

        if (!config.bundle) {
            Object.assign(config, {
                bundle: getOutputFromPackageJson(pkgJson, config.input),
            });
        }

        if (pkgJson.types) {
            Object.assign(config, { dtsRollup: true });
        }

        return config;
    } else {
        return {
            input: defaultInputPath,
            dtsRollup: !!pkgJson.types,
            bundle: getOutputFromPackageJson(pkgJson, defaultInputPath),
        };
    }
};
