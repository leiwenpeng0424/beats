import { tryReadConfig, type CLIOptions } from "@/configuration";
import * as CONSTANTS from "@/constants";
import { startRollupBundle } from "@/rollup";
import { json as Json, colors, parser } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import type { ITSConfigJson } from "@nfts/tsc-json";
import nodePath from "node:path";
import Terminal from "./terminal";

async function cli(args: string[]) {
    const [, ..._args] = args;
    const pkgJson = Json.readJSONSync<IPackageJson>(CONSTANTS.packagejson);
    const beatsPkgJson = Json.readJSONSync<IPackageJson>(
        nodePath.resolve(require.resolve(".."), "../../package.json"),
    );

    const term = new Terminal();

    term.clearScreen().box([
        colors.red(`@nfts/beats(${beatsPkgJson.version})`),
        ` `,
        colors.cyan(`This a message!!!`),
    ]);

    const {
        project,
        config: configPath,
        debug,
        verbose,
        ...restInputOptions
    } = parser<CLIOptions>(_args);

    process.env.BEATS_VERBOSE = verbose ? String(verbose) : "undefined";
    process.env.BEATS_DEBUG = debug ? String(debug) : "undefined";

    const tsConfig = Json.readJSONSync<ITSConfigJson>(
        project ?? CONSTANTS.tsconfig,
    );

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
