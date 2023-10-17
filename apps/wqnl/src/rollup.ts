import type { Config, TRollupOptions } from "@/configuration";
import * as CONSTANTS from "@/constants";
import { dtsRollup } from "@/dts";
import log from "@/log";
import { cwd, isSameRollupInput, normalizeCliInput, serialize } from "@/utils";
import { colors, ms } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import { RollupAliasOptions, alias } from "@nfts/plugin-alias";
import { RollupCleanupOptions, cleanup } from "@nfts/plugin-cleanup";
import esbuild from "@nfts/plugin-esbuild";
import { styles } from "@nfts/plugin-styles";
import type { ITSConfigJson } from "@nfts/tsc-json";
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

/**
 * Externals function for rollup.externals,
 * by default, all deps and peer deps in package.json
 * will be ignored.
 */
export const externalsGenerator = (
    externals: string[] = [],
    pkgJson: IPackageJson,
) => {
    const { dependencies = {}, peerDependencies = {} } = pkgJson;
    const nativeModules = Module.builtinModules
        .concat(Module.builtinModules.map((m) => `node:${m}`))
        .concat(
            Object.keys(dependencies).concat(Object.keys(peerDependencies)),
        );

    return (id: string) => {
        return (
            nativeModules.includes(id) ||
            externals?.includes(id) ||
            /^externals:/.test(id)
        );
    };
};

/**
 * Default plugins.
 **/
export const applyPlugins = (
    options?: Pick<
        Config,
        "eslint" | "nodeResolve" | "commonjs" | "esbuild"
    > & {
        clean?: RollupCleanupOptions;
        alias?: RollupAliasOptions;
    },
) => {
    return [
        cleanup(options?.clean),
        styles(),
        alias(options?.alias ?? { alias: {} }),
        esbuild(
            Object.assign({
                options: options?.esbuild,
                tsConfigFile: nodePath.join(cwd(), "tsconfig.json"),
            }),
        ),
        nodeResolve(
            Object.assign(
                {
                    preferBuiltins: false,
                    extensions: CONSTANTS.Extensions,
                },
                options?.nodeResolve ?? {},
            ),
        ),
        commonjs(
            Object.assign(
                {
                    extensions: CONSTANTS.Extensions,
                    requireReturnsDefault: "preferred",
                },
                options?.commonjs ?? {},
            ),
        ),
        eslint(Object.assign({}, options?.eslint ?? {})),
        // bundleProgress(),
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
    options,
    config,
    pkgJson,
}: {
    options: TRollupOptions | TRollupOptions[];
    config: Config;
    pkgJson: IPackageJson;
}) => {
    const bundles: (() => Promise<TBundleOutput>)[] = [];

    if (!Array.isArray(options)) {
        options = [options];
    }

    for await (const option of options) {
        const start = Date.now();
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
                    await bundle_.generate(output_);
                    const output = await bundle_.write(output_);
                    const duration = Date.now() - start;
                    const message = `${colors.bgBlack(
                        colors.bold(nodePath.relative(cwd(), input)),
                    )} ${colors.bold("->")} ${output_.file as string} (${ms(
                        duration,
                    )})`;

                    log.info(`${message}`);

                    return {
                        ...output,
                        duration,
                    };
                });
            }

            // One bundle one dts.
            bundles.push(async () => {
                const start = Date.now();
                await dts({
                    config,
                    pkgJson,
                    input: option["input"],
                });
                return {
                    // TODO: Add input value.
                    input: "",
                    duration: Date.now() - start,
                };
            });
        } else {
            log.verbose(
                `Output not found for input '${option.input}', skip...`,
            );
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
    {
        config,
        pkgJson,
    }: {
        config: Config;
        pkgJson: IPackageJson;
    },
) => {
    const watcher = watch(options);
    let firstRun = true;

    try {
        await new Promise<void>(() => {
            watcher
                .on(`event`, (e) => {
                    const { code } = e;
                    switch (code) {
                        case "START": {
                            firstRun && log.info("Start watching process");
                            break;
                        }

                        case "BUNDLE_START": {
                            break;
                        }

                        case "BUNDLE_END": {
                            const { input, output, duration } = e;
                            log.info(
                                `${input} -> ${output
                                    .map((outputPath) =>
                                        nodePath.relative(
                                            process.cwd(),
                                            outputPath,
                                        ),
                                    )
                                    .join(", ")}`,
                            );
                            log.info(`Bundle end in ${ms(duration)}`);
                            break;
                        }

                        case "END": {
                            firstRun = false;
                            const startTime = new Date().getTime();

                            const input = Array.isArray(options)
                                ? (options[0]["input"] as string)
                                : (options.input as string);

                            dts({
                                input,
                                config,
                                pkgJson,
                            }).then(() => {
                                log.info(`${input} -> ${pkgJson.types}`);
                                log.info(
                                    `Dts end in ${ms(Date.now() - startTime)}`,
                                );
                            });
                            break;
                        }
                        case "ERROR": {
                            log.error(e.error.message);
                            break;
                        }
                    }
                })
                .on("change", (file) => {
                    log.info(`changed: ${file}`);
                })
                .on("restart", () => log.info(`Restart`));
        });
    } catch (e) {
        //
    }
};

async function dts({
    input,
    config,
    pkgJson,
}: {
    input: string;
    config: Config;
    pkgJson: IPackageJson;
}): Promise<void> {
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
        await dtsRollup({
            input,
            watch: config.watch,
            tsConfigFile: config.project ?? CONSTANTS.tsconfig,
            dtsFileName:
                types ||
                nodePath.resolve(cwd(), outputBasepath, outputBasename),
        });
    }
}

export async function startBundle({
    config,
    pkgJson,
    tsConfig,
}: {
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
        esbuild: Object.assign(
            { minify, target: config.target ?? "ES2015" },
            esbuild ?? {},
        ),
        alias: { alias: paths },
        // clean: { active: !watch },
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
            const outFile = otherProps.file;

            const pathReWrite = (id: string) => {
                const result = /^externals:(.+)/.exec(id);
                if (result) {
                    const alias = Object.entries(paths).find((s) =>
                        s[0].startsWith("externals"),
                    );

                    if (alias && outFile) {
                        const [, realNames] = alias;
                        const [realName] = realNames;

                        const relativePath = nodePath.relative(
                            nodePath.dirname(outFile),
                            nodePath.resolve(
                                cwd(),
                                realName.replace("*", result[1]),
                            ),
                        );

                        return relativePath;
                    }
                }

                return id;
            };

            const option = {
                input:
                    bundleInput ||
                    (cliInput
                        ? normalizeCliInput(cliInput as string)
                        : CONSTANTS.input),
                output: [
                    {
                        ...otherProps,
                        sourcemap,
                        paths: pathReWrite,
                    },
                ],
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
                        {
                            ...otherProps,
                            sourcemap,
                            paths: pathReWrite,
                        },
                    ],
                });
            }

            return options;
        }, [] as TRollupOptions[]);
    }

    if (watch) {
        await watch_(bundles, { config, pkgJson });
    } else {
        const tasks = await bundle({
            options: bundles,
            config,
            pkgJson,
        });
        await serialize(tasks);
    }
}
