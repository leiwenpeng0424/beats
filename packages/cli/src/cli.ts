import { tryReadConfig, type CLIOptions } from "@/configuration";
import * as CONSTANTS from "@/constants";
import { startRollupBundle } from "@/rollup";
import { json as Json, colors, parser } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import nodePath from "node:path";
import loadEnv from "@/env";
import Terminal from "@/terminal";
import { loadTsConfigJson } from "@/tsconfig";

async function cli(args: string[]) {
    const [, ..._args] = args;
    const pkgJson = Json.readJSONSync<IPackageJson>(CONSTANTS.packagejson);
    const beatsPkgJson = Json.readJSONSync<IPackageJson>(
        nodePath.resolve(require.resolve(".."), "../../package.json"),
    );

    const term = new Terminal();

    const {
        project,
        config: configPath,
        debug = false,
        verbose = false,
        ...restInputOptions
    } = parser<CLIOptions>(_args);

    loadEnv({ DEBUG: String(debug), VERBOSE: String(verbose) });

    if (!restInputOptions.watch) {
        term.clearScreen().box([
            colors.red(`@nfts/beats(${beatsPkgJson.version})`),
            ` `,
            colors.cyan(`This a message!!!`),
        ]);
    }

    const tsConfig = loadTsConfigJson(project ?? CONSTANTS.tsconfig);

    const config = await tryReadConfig({
        configPath,
        pkgJson,
    });

    return startRollupBundle({
        term,
        config: {
            ...config,
            ...restInputOptions,
            project,
        },
        pkgJson,
        tsConfig,
    });
}

cli(process.argv.slice(1))
    .then(() => {
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit();
    });
