import { type Config } from "@/configuration";
import bundleProgress from "@/plugins/bundleProgress";
import cleanup, { RollupCleanupOptions } from "@/plugins/cleanup";
import esbuild from "@/plugins/esbuild";
import {
    clearScreen,
    cwd,
    isSameRollupInput,
    normalizeCliInput,
} from "@/utils";
import { type IPackageJson } from "@nfts/pkg-json";
import { type ITSConfigJson } from "@nfts/tsc-json";
import { ms } from "@nfts/utils";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import nodeResolve from "@rollup/plugin-node-resolve";
import Module from "node:module";
import nodePath from "node:path";
import {
    OutputOptions,
    rollup,
    type RollupOptions,
    type RollupOutput,
    type RollupWatchOptions,
    watch,
} from "rollup";
// import postcssPlugin from "@/plugins/styles";
import { debugLog, verboseLog } from "@/log";
import alias, { RollupAliasOptions } from "@/plugins/alias";
import dtsGen from "@/plugins/dtsGen";
import styles from "rollup-plugin-styles";

const defaultEntry = "src/index";
const tsConfigFilePath = "tsconfig.json";

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
    /**
     * Default exclude deps and peerDeps
     */
    const { dependencies = {}, peerDependencies = {} } = pkgJson;
    const nativeModules = Module.builtinModules
        .concat(Module.builtinModules.map((m) => `node:${m}`))
        .concat(
            Object.keys(dependencies).concat(Object.keys(peerDependencies)),
        );

    return (id: string) => {
        return externals?.includes(id) || nativeModules.includes(id);
    };
};

/**
 * Default plugins.
 **/
export const applyPlugins = (
    options?: Pick<
        Config,
        "eslint" | "nodeResolve" | "commonjs" | "esbuild" | "clean" | "styles"
    > & {
        clean?: RollupCleanupOptions;
        alias?: RollupAliasOptions;
    },
) => {
    return [
        alias(options?.alias ?? { alias: {} }),
        styles(options?.styles),
        // @TODO
        // postcssPlugin({ cssModules: true }),
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
        cleanup(options?.clean),
        bundleProgress(),
        /**
         * @OPTIONAL
         * @NOTICE: Keep eslint plugins always at the bottom.
         */
        eslint(Object.assign({}, options?.eslint ?? {})),
    ].filter(Boolean);
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
                    const start = Date.now();
                    await bundle_.generate(output_);
                    const output = await bundle_.write(output_);

                    return {
                        ...output,
                        input: option.input as string | string[],
                        duration: Date.now() - start,
                    };
                });
            }

            bundles = bundles.concat(bundles_);
        } else {
            verboseLog(`Output not found for input '${option.input}', skip...`);
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
        await new Promise<void>(() => {
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
                        console.error(`Rollup bundle error:`, e);
                        break;
                    }
                }
            });
        });
    } catch (e) {
        //
    }
};

export const startRollupBundle = async ({
    config,
    pkgJson,
    tsConfig,
}: {
    config: Config;
    pkgJson: IPackageJson;
    tsConfig: ITSConfigJson;
}) => {
    const {
        externals,
        rollup: rollupOpt = {},
        input: configInput, //
    } = config;

    const { bin } = pkgJson;

    const paths = tsConfig.compilerOptions?.paths ?? {};

    const {
        eslint,
        commonjs,
        nodeResolve,
        esbuild,
        styles,
        minify,
        sourcemap,
        project,
        input: cliInput,
        watch,
    } = config;

    const rollupPlugins = applyPlugins({
        eslint,
        commonjs,
        nodeResolve,
        esbuild: Object.assign({ minify }, esbuild ?? {}),
        styles,
        alias: { alias: paths },
    });

    const externalsFn = externalsGenerator(externals, pkgJson);

    let bundles: RollupOptions[] = [];

    const { plugins: extraPlugins = [], ...rollupOpts } = rollupOpt;

    const rollupOptionWithoutInputOutput: Omit<
        RollupOptions,
        "input" | "output"
    > = {
        perf: true,
        treeshake: true,
        strictDeprecations: true,
        plugins: [...rollupPlugins, extraPlugins],
        external: externalsFn,
        ...(rollupOpts ?? {}),
    };

    if (config.bundle) {
        bundles = config.bundle.reduce((options, bundle) => {
            const { input: bundleInput, ...otherProps } = bundle;

            const option = {
                input:
                    bundleInput ||
                    configInput ||
                    (cliInput
                        ? normalizeCliInput(cliInput as string)
                        : defaultEntry),
                output: [{ ...otherProps, sourcemap }],
                ...rollupOptionWithoutInputOutput,
            } as RollupOptions;

            if (options.length === 0) {
                return [option];
            }

            const i = options.findIndex((o) =>
                isSameRollupInput(o.input, option.input),
            );

            if (i === -1) {
                options.push(option);
            } else {
                options[i] = Object.assign({}, options[i], {
                    output: [
                        ...(options[i].output as OutputOptions[]),
                        { ...otherProps, sourcemap },
                    ],
                });
            }

            return options;
        }, [] as RollupOptions[]);
    }

    // if (bin) {
    //     Object.keys(bin).forEach((binName) => {
    //         const binOutput = bin[binName];
    //         const binInput = nodePath.join(cwd(), `src/${binName}`);
    //
    //         const _output: RollupOptions = {
    //             input: binInput,
    //             output: {
    //                 format: pkgJson.module === "module" ? "esm" : "cjs",
    //                 file: nodePath.join(
    //                     //
    //                     cwd(),
    //                     binOutput,
    //                 ),
    //             },
    //             ...rollupOptionWithoutInputOutput,
    //         };
    //
    //         bundles.push(_output);
    //     });
    // }

    if (config.dtsRollup) {
        debugLog(`Enable dtsRollup`);
        if (pkgJson.types) {
            bundles.push({
                input: defaultEntry,
                output: { file: pkgJson.types, format: "esm" },
                ...rollupOptionWithoutInputOutput,
                plugins: [
                    dtsGen({
                        tsConfigFile: project ?? tsConfigFilePath,
                        dtsFileName: pkgJson.types,
                    }),
                    // Exclude eslint plugin for DTS bundle.
                    ...rollupPlugins.slice(0, -1),
                ],
            });
        } else {
            verboseLog(
                //
                `dtsRollup is enabled, but no 'types' or 'typings' field in package.json`,
            );
        }
    }

    if (watch) {
        await watch_(bundles);
    } else {
        await Promise.all((await bundle(bundles)).map((task) => task()));
    }
};
