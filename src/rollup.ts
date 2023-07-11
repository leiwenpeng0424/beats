import { type IPackageJson } from "@nfts/pkg-json";
import { ms } from "@nfts/utils";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import nodeResolve from "@rollup/plugin-node-resolve";
import Module from "node:module";
import nodePath from "node:path";
import {
    rollup,
    watch,
    type Plugin,
    type RollupOptions,
    type RollupOutput,
    type RollupWatchOptions,
} from "rollup";
import { type Config } from "./configuration";
import esbuild from "./plugins/esbuild.plugin";
import { clearScreen, cwd } from "./utils";
import binGen, { RollupBinGenOptions } from "./plugins/binGen.plugin";
import bundleProgress from "./plugins/bundleProgress.plugin";
import cleanup, { RollupCleanupOptions } from "./plugins/cleanup.plugin";

export const EXTENSIONS = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".mjs",
    ".cjs",
    ".mts",
    ".cts",
    ".node",
];

/**
 *
 * @desc Externals function for rollup.externals,
 * by default, all devDependencies and dependencies in package.json
 * will be ignored.
 *
 */
export const externalsGenerator = (
    externals: string[] = [],
    pkgJson: IPackageJson,
) => {
    const { dependencies = {}, devDependencies = {} } = pkgJson;
    const nativeModules = Module.builtinModules
        .concat(Module.builtinModules.map((m) => `node:${m}`))
        .concat(Object.keys(dependencies).concat(Object.keys(devDependencies)));

    return (id: string) => {
        if (externals?.includes(id)) {
            return true;
        }
        let isExtractExternal = false;
        if (nativeModules.includes(id)) {
            isExtractExternal = true;
        }
        return isExtractExternal;
    };
};

/**
 *
 * Default plugins.
 *
 *
 **/
export const applyPlugins = (
    extraPlugins: Plugin[] = [],
    options?: Pick<
        Config,
        "eslint" | "nodeResolve" | "commonjs" | "esbuild" | "clean"
    > & { binGen?: RollupBinGenOptions; clean?: RollupCleanupOptions },
) => {
    const defaultPlugins = [
        esbuild(
            Object.assign({
                options: options?.esbuild,
                tsConfigFile: nodePath.join(cwd(), "tsconfig.json"),
            }),
        ),
        nodeResolve(
            Object.assign(
                {
                    rootDir: cwd(),
                    preferBuiltins: false,
                    extensions: EXTENSIONS,
                },
                options?.nodeResolve ?? {},
            ),
        ),
        commonjs(
            Object.assign({ extensions: EXTENSIONS }, options?.commonjs ?? {}),
        ),
        bundleProgress(),
        cleanup(options?.clean),
        /**
         * @OPTIONAL
         * @NOTICE Optional plugin, only invoke when binGen exist.
         */
        options?.binGen && binGen(options?.binGen),
        /**
         * @OPTIONAL
         * @NOTICE: Keep eslint plugins always at the bottom.
         */
        eslint(Object.assign({}, options?.eslint ?? {})),
    ].filter(Boolean);

    return [...defaultPlugins, ...extraPlugins];
};

export type TBundleOutput = {
    /**
     * Duration time.(ms)
     */
    duration: number;
    input: string | string[];
} & RollupOutput;

/**
 *
 * Get all bundle tasks.
 *
 */
export const bundle = async (options: RollupOptions | RollupOptions[]) => {
    let bundles: (() => Promise<TBundleOutput>)[] = [];

    if (!Array.isArray(options)) {
        options = [options];
    }

    for await (const option of options) {
        const bundle_ = await rollup(option);
        let { output } = option;
        if (output) {
            if (output && !Array.isArray(output)) {
                output = [output];
            }

            const bundles_: (() => Promise<TBundleOutput>)[] = [];

            for (const output_ of output) {
                // Add bundle task
                bundles_.push(async () => {
                    const start = new Date().getTime();
                    await bundle_.generate(output_);
                    const output = await bundle_.write(output_);
                    return {
                        ...output,
                        input: option.input as string | string[],
                        duration: new Date().getTime() - start,
                    };
                });
            }

            bundles = bundles.concat(bundles_);
        } else {
            // TODO: Write warning to terminal
            return [];
        }
    }

    return bundles;
};

/**
 *
 * Dev process
 *
 */
export const watch_ = async (
    options: RollupWatchOptions | RollupWatchOptions[],
) => {
    const watcher = watch(options);
    let firstRun = true;

    let start: number;

    try {
        await new Promise<void>((resolve, reject) => {
            watcher.on(`event`, (e) => {
                const code = e.code;
                switch (code) {
                    case "START": {
                        clearScreen();
                        if (firstRun) {
                            console.log(`Start rollup watching bundle.`);
                        }
                        start = new Date().getTime();
                        break;
                    }

                    case "BUNDLE_END": {
                        break;
                    }

                    case "BUNDLE_START": {
                        break;
                    }

                    case "END": {
                        if (firstRun) {
                            console.log(
                                `Bundle end in ${ms(
                                    new Date().getTime() - start,
                                )}`,
                            );
                        } else {
                            console.log(
                                `Re-bundle end ${ms(
                                    new Date().getTime() - start,
                                )}`,
                            );
                        }
                        firstRun = false;
                        break;
                    }
                    case "ERROR": {
                        console.error(`Rollup bundle error:`, e.result);
                        // watcher.close().finally(() => {
                        //     reject();
                        // });
                        break;
                    }
                }
            });
        });
    } catch (e) {
        //
    }
};
