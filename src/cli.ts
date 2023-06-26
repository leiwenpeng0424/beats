import { cwd, parser } from "./utils";
import { tryReadConfigFromRoot } from "./configuration";
import { applyPlugins, bundle, externalsGenerator } from "./rollup";
import esbuild from "./plugins/esbuild.plugin";
import nodePath from "node:path";
import { type OutputOptions, type Plugin, type RollupOptions } from "rollup";
import dtsGen from "./plugins/dtsGen.plugin";
import { fileSystem } from "@nfts/utils";
import { IPackageJson } from "@nfts/pkg-json";
import binGen from "./plugins/binGen.plugin";
import eslint from "@rollup/plugin-eslint";
import { ms } from "@nfts/utils";

const packageFilePath = "package.json";

const cli = async (args: string[]) => {
    const [, ..._args] = args;

    const pkgJson = fileSystem.readJSONSync<IPackageJson>(packageFilePath);

    const { sourcemap, configFile, project } = parser<{
        sourcemap?: boolean;
        configFile?: string;
        project?: string;
        verbose?: boolean;
    }>(_args);

    const config = await tryReadConfigFromRoot({
        configPath: configFile,
        pkgJson,
    });

    const internalPlugins: Plugin[] = [];

    const rollupPlugins = applyPlugins(internalPlugins, { sourcemap });

    // Use esbuild for fast ts compile
    rollupPlugins.unshift(
        esbuild({
            options: config.esbuild,
            tsConfigFile: nodePath.join(cwd(), project ?? "tsconfig.json"),
        }),
    );

    const {
        rollup, //
        externals,
        input,
    } = config;

    const externalsFn = externalsGenerator(externals, pkgJson);

    if (config.bundle) {
        const bundles = config.bundle.reduce((options, bundle) => {
            const { input: input_, ...otherProps } = bundle;

            const option = {
                input: input_ || input,
                output: [{ ...otherProps, sourcemap }],
                plugins: rollupPlugins.concat(eslint({})),
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

        const bundleTasks = await bundle(bundles);

        return await Promise.all(bundleTasks.map((task) => task()));
    }
};

cli(process.argv.slice(1))
    .then((rollupOutputs) => {
        console.log("");
        rollupOutputs?.forEach((out) => {
            const [output] = out.output;
            const { input } = out;
            console.log(input.toString());
            console.log(
                new Array(input.toString().length - 1)
                    .fill(0)
                    .reduce((a) => a + " ", ""),
                `|- ${output.fileName}`,
            );
        });
    })
    .catch((e) => {
        console.error(e);
    });
