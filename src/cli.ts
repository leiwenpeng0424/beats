import { cwd, parser } from "./utils";
import { tryReadConfigFromRoot } from "./configuration";
import { applyPlugins, bundle, externalsGenerator } from "./rollup";
import esbuild from "./plugins/esbuild.plugin";
import nodePath from "node:path";
import { Plugin, RollupOptions } from "rollup";
import dts from "./plugins/dts.plugin";
import { fileSystem } from "@nfts/utils";
import { IPackageJson } from "@nfts/pkg-json";

const packageFilePath = "package.json";

const cli = async (args: string[]) => {
    const [, ..._args] = args;

    const pkgJson = fileSystem.readJSONSync<IPackageJson>(packageFilePath);

    const { sourcemap, configFile, project } = parser<{
        sourcemap?: boolean;
        configFile?: string;
        project?: string;
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
        const rollupOptionsArr = config.bundle.map((bundle) => {
            const { input: input_, ...otherProps } = bundle;

            return {
                input: input_ || input,
                output: [otherProps],
                plugins: rollupPlugins,
                external: externalsFn,
                ...rollup,
            };
        }) as RollupOptions[];

        if (config.dtsRollup) {
            if (config.dtsRollup && !pkgJson.types) {
                throw new Error(
                    "'dtsRollup' is enabled, Looks like you forget to add types field in your local package.json file",
                );
            }

            rollupOptionsArr.push({
                input: "src/index",
                output: { file: pkgJson.types, format: "esm" },
                external: externalsFn,
                plugins: [
                    dts({
                        tsConfigFile: "tsconfig.json",
                        dtsFileName: pkgJson.types,
                    }),
                    ...rollupPlugins,
                ],
                ...rollup,
            });
        }

        const bundleTasks = await bundle(rollupOptionsArr);

        await Promise.all(bundleTasks.map((task) => task()));
    }
};

cli(process.argv.slice(1))
    .then(() => {
        console.log("finished");
    })
    .catch((e) => {
        console.error(e);
    });
