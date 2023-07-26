import type { IPackageJson } from "@nfts/pkg-json";
import { json as Json, parser } from "@nfts/nodeutils";
import { type CLIOptions, tryReadConfigFromRoot } from "@/configuration";
import { startRollupBundle } from "@/rollup";
import { cwd, depsInfo } from "@/utils";
import type { ITSConfigJson } from "@nfts/tsc-json";
import { debugLog } from "@/log";
import nodePath from "node:path";

const tsConfigFilePath = "tsconfig.json";
const packageJsonFilePath = "package.json";

const cli = async (args: string[]) => {
    const [, ..._args] = args;
    const pkgJson = Json.readJSONSync<IPackageJson>(packageJsonFilePath);
    const {
        project,
        config: configPath,
        debug,
        verbose,
        ...restInputOptions
    } = parser<CLIOptions>(_args);

    process.env.BEATS_VERBOSE = verbose ? String(verbose) : "undefined";
    process.env.BEATS_DEBUG = debug ? String(debug) : "undefined";

    depsInfo();

    const tsConfig = Json.readJSONSync<ITSConfigJson>(
        tsConfigFilePath ?? project,
    );

    debugLog(
        `tsconfig -> ${nodePath.join(cwd(), tsConfigFilePath ?? project)}\n`,
    );

    const config = await tryReadConfigFromRoot({
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
};

cli(process.argv.slice(1))
    .then(() => {
        //
    })
    .catch((e) => {
        console.error(e);
    });
