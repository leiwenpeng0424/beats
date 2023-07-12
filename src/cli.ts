import { IPackageJson } from "@nfts/pkg-json";
import { fileSystem } from "@nfts/utils";
import { type OutputOptions, type Plugin, type RollupOptions } from "rollup";
import { CLIOptions, tryReadConfigFromRoot } from "./configuration";
import dtsGen from "./plugins/dtsGen";
import { applyPlugins, bundle, externalsGenerator, watch_ } from "./rollup";
import { isSameRollupInput, normalizeCLIInput, parser } from "./utils";

const packageFilePath = "package.json";

const cli = async (args: string[]) => {
    const [, ..._args] = args;
    const pkgJson = fileSystem.readJSONSync<IPackageJson>(packageFilePath);
    const {
        input: cliInput,
        config: configPath,
        watch,
        verbose,
        sourcemap,
        project,
    } = parser<CLIOptions>(_args);

    // @remarks Add verbose flag to ENV.
    process.env.BEATS_VERBOSE = verbose ? "true" : undefined;

    const config = await tryReadConfigFromRoot({
        configPath,
        pkgJson,
    });
    const internalPlugins: Plugin[] = [];
    const { eslint, commonjs, nodeResolve, esbuild } = config;
    const rollupPlugins = applyPlugins(internalPlugins, {
        eslint,
        commonjs,
        nodeResolve,
        esbuild,
        binGen: { bin: pkgJson.bin },
    });
    const { rollup, externals, input: configInput } = config;
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
                        : "src/index"),
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
                input: "src/index",
                output: { file: pkgJson.types, format: "esm" },
                external: externalsFn,
                plugins: [
                    dtsGen({
                        tsConfigFile: project ?? "tsconfig.json",
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

cli(process.argv.slice(1))
    .then(() => {
        //
    })
    .catch((e) => {
        console.error(e);
    });
