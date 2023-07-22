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
    type Plugin,
    rollup,
    type RollupOptions,
    type RollupOutput,
    type RollupWatchOptions,
    watch,
} from "rollup";
import { type Config } from "@/configuration";
import esbuild from "@/plugins/esbuild";
import {
    clearScreen,
    cwd,
    isSameRollupInput,
    normalizeCLIInput,
} from "@/utils";
import binGen, { RollupBinGenOptions } from "@/plugins/binGen";
import bundleProgress from "@/plugins/bundleProgress";
import cleanup, { RollupCleanupOptions } from "@/plugins/cleanup";
// import postcssPlugin from "@/plugins/styles";
import styles from "rollup-plugin-styles";
import alias, { RollupAliasOptions } from "@/plugins/alias";
import dtsGen from "@/plugins/dtsGen";

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
 *
 * Default plugins.
 *
 *
 **/
export const applyPlugins = (
    extraPlugins: Plugin[] = [],
    options?: Pick<
        Config,
        "eslint" | "nodeResolve" | "commonjs" | "esbuild" | "clean" | "styles"
    > & {
        binGen?: RollupBinGenOptions;
        clean?: RollupCleanupOptions;
        alias?: RollupAliasOptions;
    },
) => {
    const defaultPlugins = [
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
        rollup,
        externals,
        input: configInput, //
    } = config;

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

    const rollupPlugins = applyPlugins([], {
        eslint,
        commonjs,
        nodeResolve,
        esbuild: Object.assign({ minify }, esbuild ?? {}),
        styles,
        binGen: { bin: pkgJson.bin },
        alias: { alias: paths },
    });

    const externalsFn = externalsGenerator(externals, pkgJson);

    if (config.bundle) {
        const bundles = config.bundle.reduce((options, bundle) => {
            const { input: bundleInput, ...otherProps } = bundle;

            const option = {
                input:
                    bundleInput ||
                    configInput ||
                    (cliInput
                        ? normalizeCLIInput(cliInput as string)
                        : defaultEntry),
                output: [{ ...otherProps, sourcemap }],
                plugins: rollupPlugins,
                external: externalsFn,
                ...rollup,
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

        if (config.dtsRollup) {
            if (config.dtsRollup && !pkgJson.types) {
                throw new Error(
                    "'dtsRollup' is enabled, Looks like you forget to add types field in your local package.json file",
                );
            }

            bundles.push({
                input: defaultEntry,
                output: { file: pkgJson.types, format: "esm" },
                external: externalsFn,
                plugins: [
                    dtsGen({
                        tsConfigFile: project ?? tsConfigFilePath,
                        dtsFileName: pkgJson.types,
                    }),
                    // Exclude eslint plugin for DTS bundle.
                    ...rollupPlugins.slice(0, -1),
                ],
                ...rollup,
            });
        }

        if (watch) {
            await watch_(bundles);
        } else {
            const bundleTasks = await bundle(bundles);
            await Promise.all(bundleTasks.map((task) => task()));
        }
    }
};
