import { type Config, type TRollupOptions } from "@/configuration";
import bundleProgress from "@/plugins/bundleProgress";
import cleanup, { RollupCleanupOptions } from "@/plugins/cleanup";
import esbuild from "@/plugins/esbuild";
import {
    cwd,
    isSameRollupInput,
    measure,
    normalizeCliInput,
    serialize,
} from "@/utils";
import { colors, ms } from "@nfts/nodeutils";
import { type IPackageJson } from "@nfts/pkg-json";
import { type ITSConfigJson } from "@nfts/tsc-json";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import nodeResolve from "@rollup/plugin-node-resolve";
import Module from "node:module";
import nodePath from "node:path";
import {
    rollup,
    watch,
    type RollupOptions,
    type RollupOutput,
    type RollupWatchOptions,
} from "rollup";
// import postcssPlugin from "@/plugins/styles";
import * as CONSTANTS from "@/constants";
import { dtsGen } from "@/dts";
import { verboseLog } from "@/log";
import alias, { RollupAliasOptions } from "@/plugins/alias";
import styles from "rollup-plugin-styles";
import Terminal from "./terminal";

export const Extensions = [
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

export const StyleSheetExtensions = [".css", ".less", ".scss", ".sass"];

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
        "eslint" | "nodeResolve" | "commonjs" | "esbuild" | "styles"
    > & {
        clean?: RollupCleanupOptions;
        alias?: RollupAliasOptions;
    },
) => {
    return [
        cleanup(options?.clean),
        styles(options?.styles),
        alias(options?.alias ?? { alias: {} }),
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
                    extensions: Extensions,
                },
                options?.nodeResolve ?? {},
            ),
        ),
        commonjs(
            Object.assign({ extensions: Extensions }, options?.commonjs ?? {}),
        ),
        eslint(Object.assign({}, options?.eslint ?? {})),
        bundleProgress(),
    ].filter(Boolean);
};

export type TBundleOutput =
    | {
          duration: number;
          input: string;
      }
    | RollupOutput;

/**
 *
 * Get all bundle tasks.
 *
 */
export const bundle = async ({
    term,
    options,
    config,
    pkgJson,
}: {
    term: Terminal;
    options: TRollupOptions | TRollupOptions[];
    config: Config;
    pkgJson: IPackageJson;
}) => {
    const bundles: (() => Promise<TBundleOutput>)[] = [];

    if (!Array.isArray(options)) {
        options = [options];
    }

    for await (const option of options) {
        const bundle_ = await rollup(option);
        let { output } = option;
        const { input } = option;
        if (output) {
            if (output && !Array.isArray(output)) {
                output = [output];
            }

            for (const output_ of output) {
                // Add bundle task
                bundles.push(async () => {
                    const start = Date.now();
                    await bundle_.generate(output_);
                    const output = await bundle_.write(output_);

                    const duration = Date.now() - start;

                    const message = ` ✨ ${colors.bgBlack(
                        colors.bold(nodePath.relative(cwd(), input)),
                    )} ${colors.bold("->")} ${output_.file as string} (${ms(
                        duration,
                    )})`;

                    term.writeLine(message);
                    term.nextLine();

                    return {
                        ...output,
                        duration,
                    };
                });
            }

            // One bundle one dts.
            bundles.push(async () => {
                const start = Date.now();
                await dts({ term, config, pkgJson, rollup: option });
                return {
                    // TODO: Add input value.
                    input: "",
                    duration: Date.now() - start,
                };
            });
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
    term: Terminal,
    {
        bundleEnd,
        bundleStart,
        start,
        end,
        error,
    }: {
        bundleEnd?: () => void;
        bundleStart?: () => void;
        start?: () => void;
        end?: () => Promise<void>;
        error?: () => void;
    } = {},
) => {
    const watcher = watch(options);
    let firstRun = true;
    let startTime: number;
    try {
        await new Promise<void>(() => {
            watcher.on(`event`, (e) => {
                const code = e.code;
                switch (code) {
                    case "START": {
                        term.clearScreen();
                        start?.();
                        if (firstRun) {
                            term.writeLine(`Start rollup watching bundle.`);
                        }
                        startTime = new Date().getTime();
                        break;
                    }

                    case "BUNDLE_START": {
                        bundleStart?.();
                        break;
                    }

                    case "BUNDLE_END": {
                        bundleEnd?.();
                        break;
                    }

                    case "END": {
                        end?.().finally(() => {
                            if (firstRun) {
                                term.writeLine(
                                    `Bundle end in ${ms(
                                        new Date().getTime() - startTime,
                                    )}`,
                                );
                            } else {
                                term.writeLine(
                                    `Re-bundle end ${ms(
                                        new Date().getTime() - startTime,
                                    )}`,
                                );
                            }
                            firstRun = false;
                        });

                        break;
                    }
                    case "ERROR": {
                        error?.();
                        term.clearScreen().writeLine(
                            `Bundle Error: ${e.error.message}`,
                        );
                        break;
                    }
                }
            });
        });
    } catch (e) {
        //
    }
};

async function dts({
    term,
    config,
    rollup,
    pkgJson,
}: {
    term: Terminal;
    config: Config;
    rollup: TRollupOptions;
    pkgJson: IPackageJson;
}): Promise<void> {
    const { input } = rollup;
    const { module, main, types } = pkgJson;
    const output = module || main;

    const inputBasename = nodePath.basename(input);
    const outputBasepath = output
        ? nodePath.dirname(output)
        : CONSTANTS.outputDir;

    const ext = nodePath.extname(inputBasename);

    const outputBasename = ext
        ? inputBasename.replace(ext, ".d.ts")
        : `${inputBasename ?? "index"}.d.ts`;

    if (config.dtsRollup) {
        await measure("dts", async () => {
            await dtsGen({
                term,
                input,
                tsConfigFile: config.project ?? CONSTANTS.tsconfig,
                dtsFileName:
                    types ||
                    nodePath.resolve(cwd(), outputBasepath, outputBasename),
            });
        });
    }
}

/**
 * Start rollup bundle process.
 * @param config
 * @param pkgJson
 * @param tsConfig
 * @param term
 */
export async function startRollupBundle({
    term,
    config,
    pkgJson,
    tsConfig,
}: {
    term: Terminal;
    config: Config;
    pkgJson: IPackageJson;
    tsConfig: ITSConfigJson;
}) {
    const paths = tsConfig.compilerOptions?.paths ?? {};
    const {
        eslint,
        commonjs,
        nodeResolve,
        esbuild,
        styles,
        rollup: rollupOpt = {} as TRollupOptions,
        // Options
        externals,
        minify,
        sourcemap,
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
        clean: { active: !watch },
    });

    const externalsFn = externalsGenerator(externals, pkgJson);

    let bundles: TRollupOptions[] = [];

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
                    (cliInput
                        ? normalizeCliInput(cliInput as string)
                        : CONSTANTS.input),
                output: [{ ...otherProps, sourcemap }],
                ...rollupOptionWithoutInputOutput,
            } as TRollupOptions;

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
                        ...(options[i].output as TRollupOptions[]),
                        { ...otherProps, sourcemap },
                    ],
                });
            }

            return options;
        }, [] as TRollupOptions[]);
    }

    if (watch) {
        await watch_(bundles, term, {
            async end() {
                await Promise.all(
                    bundles.map(async (opts) => {
                        await dts({
                            term,
                            config,
                            pkgJson,
                            rollup: opts,
                        });
                    }),
                );
            },
        });
    } else {
        await measure("rollup", async () => {
            const tasks = await bundle({
                options: bundles,
                config,
                pkgJson,
                term,
            });
            await serialize(tasks);
        });
    }
}
