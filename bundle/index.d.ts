import { ModuleFormat } from 'rollup';
import { Plugin } from 'rollup';
import { RollupOptions } from 'rollup';
import { TransformOptions } from 'esbuild';

declare interface Config {
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

export declare function defineConfig(options: Config): Config;

declare type TBundleConfig = {
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

declare type TRollupTransformOptions = TransformOptions;

export { }
