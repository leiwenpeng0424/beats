import { IPackageJson } from "@nfts/pkg-json";
import { fileSystem, ms } from "@nfts/utils";
import { type OutputOptions, type Plugin, type RollupOptions } from "rollup";
import TtyTable from "tty-table";
import { tryReadConfigFromRoot } from "./configuration";
import binGen from "./plugins/binGen.plugin";
import dtsGen from "./plugins/dtsGen.plugin";
import { applyPlugins, bundle, externalsGenerator, watch_ } from "./rollup";
import { headers, parser } from "./utils";

const packageFilePath = "package.json";

const cli = async (args: string[]) => {
    const [, ..._args] = args;

    const pkgJson = fileSystem.readJSONSync<IPackageJson>(packageFilePath);

    const { sourcemap, configFile, watch } = parser<{
        sourcemap?: boolean;
        configFile?: string;
        project?: string;
        verbose?: boolean;
        watch?: boolean;
    }>(_args);

    const config = await tryReadConfigFromRoot({
        configPath: configFile,
        pkgJson,
    });

    const internalPlugins: Plugin[] = [];

    const { eslint, styles, commonjs, nodeResolve } = config;

    const rollupPlugins = applyPlugins(internalPlugins, {
        eslint,
        styles,
        commonjs,
        nodeResolve,
    });

    const { rollup, externals, input } = config;

    const externalsFn = externalsGenerator(externals, pkgJson);

    if (config.bundle) {
        const bundles = config.bundle.reduce((options, bundle) => {
            const { input: input_, ...otherProps } = bundle;

            const option = {
                input: input_ || input,
                output: [{ ...otherProps, sourcemap }],
                plugins: rollupPlugins,
                external: externalsFn,
                ...rollup,
            } as RollupOptions;

            if (options.length === 0) {
                return [option];
            }

            const i = options.findIndex(
                // FIXME: Better condition judgment?
                (o) => o.input?.toString() === option.input?.toString(),
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
                        tsConfigFile: "tsconfig.json",
                        dtsFileName: pkgJson.types,
                    }),
                    ...rollupPlugins,
                ],
                ...rollup,
            });
        }

        if (pkgJson.bin) {
            rollupPlugins.push(binGen());
        }

        if (watch) {
            return watch_(bundles);
        } else {
            const bundleTasks = await bundle(bundles);
            return await Promise.all(bundleTasks.map((task) => task()));
        }
    }
};

cli(process.argv.slice(1))
    .then((rollupOutputs) => {
        const outputs = rollupOutputs?.map((out) => {
            const [output] = out.output;
            const { input, duration } = out;
            return {
                input: input.toString(),
                output: output.fileName,
                duration: ms(duration),
            };
        });

        if (outputs) {
            const t1 = TtyTable(headers, outputs).render();
            console.log(t1);
            console.log("");
        }
    })
    .catch((e) => {
        console.error(e);
    });
