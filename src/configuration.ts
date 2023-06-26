import { cwd } from "./utils";
import nodePath from "node:path";
import nodeFs from "node:fs/promises";
import { type IPackageJson } from "@nfts/pkg-json";
import { type ModuleFormat, Plugin, type RollupOptions } from "rollup";
import { modulex } from "@nfts/utils";
import { type TRollupTransformOptions } from "./plugins/esbuild.plugin";

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

    return "umd";
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
};

export interface Config {
    /**
     * Entry file for all bundle output. If you not specified in bundle item.
     * this would be the default input.
     */
    input: string | string[] | Record<string, string>;

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

    /**
     * Extra rollup options.
     */
    rollup?: Omit<RollupOptions, "plugins" | "output" | "input">;

    /**
     * Output options.
     */
    bundle?: TBundleConfig[];
}

const defaultInputPath = ["./src/index"];

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

        return config;
    } else {
        throw new Error(
            `Config file for beats is not found or error encounter while read config`,
        );
    }
};
