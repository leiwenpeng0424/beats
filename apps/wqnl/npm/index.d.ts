import type { IPackageJson } from '@nfts/pkg-json';
import type { ModuleFormat } from 'rollup';
import type { Plugin as Plugin_2 } from 'rollup';
import type { RollupCommonJSOptions } from '@rollup/plugin-commonjs';
import type { RollupEslintOptions } from '@rollup/plugin-eslint';
import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve';
import type { RollupOptions } from 'rollup';
import type { TRollupTransformOptions } from '@nfts/plugin-esbuild';
import { TTarget } from '@nfts/tsc-json';

export declare interface CLIOptions {
    /**
     * Entry file for all bundle output. If you are not specified in bundle item.
     * this would be the default input.
     */
    input?: string;

    /**
     * Output declarations rollup file.
     */
    dtsRollup?: boolean;

    /**
     * Generate .map file for each output.
     */
    sourcemap?: boolean | "inline" | "hidden";

    /**
     * `wqnl` config file.
     */
    config?: string;

    /**
     * tsconfig file.
     */
    project?: string;

    /**
     * Print verbose message.
     */
    verbose?: boolean;

    /**
     * Start watch mode.
     */
    watch?: boolean;

    /**
     * Cleanup before bundle write.
     */
    clean?: boolean;

    /**
     * minify output code.
     */
    minify?: boolean;

    /**
     * Show debug message.
     */
    debug?: boolean;

    /**
     * Build target
     */
    target?: TTarget;
}

export declare interface Config extends CLIOptions {
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

/**
 * Configuration define helper.
 * @param options
 */
export declare function defineConfig(options: Config) {
    return options;
}

export declare type TBundleConfig = {
    input?: string;
    dir?: string;
    file?: string;
    format?: ModuleFormat;
    globals?: string[];
    plugins?: Plugin_2[];
    paths?: {
        [K: string]: string;
    };
    sourcemap?: boolean | "inline" | "hidden";
    exports?: "auto" | "default" | "named" | "none";
};

export declare type TRollupOptions = Omit<RollupOptions, "input"> & {
    input: string;
};

/**
 * Read config from project.
 * @param configPath
 * @param pkgJson
 */
export declare async function tryReadConfig({
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
        config = m.import_<Config>(configPath);

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

export { }
