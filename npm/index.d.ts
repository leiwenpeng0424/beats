import { IPackageJson } from '@nfts/pkg-json';
import { ModuleFormat } from 'rollup';
import { Plugin as Plugin_2 } from 'rollup';
import { RollupCommonJSOptions } from '@rollup/plugin-commonjs';
import { RollupEslintOptions } from '@rollup/plugin-eslint';
import { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve';
import { RollupOptions } from 'rollup';
import { TransformOptions } from 'esbuild';

export declare interface CLIOptions {
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
};

export declare type TRollupOptions = Omit<RollupOptions, "input"> & {
    input: string;
};

declare type TRollupTransformOptions = TransformOptions;

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

export { }
