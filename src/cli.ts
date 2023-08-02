import { type CLIOptions, tryReadConfig } from "@/configuration";
import * as CONSTANTS from "@/constants";
import { debugLog } from "@/log";
import { startRollupBundle } from "@/rollup";
import { box, cwd } from "@/utils";
import { json as Json, parser } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import type { ITSConfigJson } from "@nfts/tsc-json";
import nodePath from "node:path";

async function cli(args: string[]) {
    const [, ..._args] = args;
    const pkgJson = Json.readJSONSync<IPackageJson>(CONSTANTS.packagejson);
    const beatsPkgJson = Json.readJSONSync<IPackageJson>(
        nodePath.resolve(require.resolve(".."), "../../package.json"),
    );

    box(`@nfts/beats (${beatsPkgJson.version})`);

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

    debugLog(
        `tsconfig -> ${nodePath.join(cwd(), project ?? CONSTANTS.tsconfig)}\n`,
    );

    const config = await tryReadConfig({
        configPath,
        pkgJson,
    });

    return startRollupBundle({
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
        //
    })
    .catch((e) => {
        console.error(e);
    });
