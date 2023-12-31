import * as CONSTANTS from "@/constants";
import loadEnv from "@/env";
import log from "@/log";
import nodePath from "node:path";
import type { IPackageJson } from "@nfts/pkg-json";
import { json as Json, colors, parser } from "@nfts/nodeutils";
import { loadTsConfigJson } from "@/tsconfig";
import { startBundle } from "@/rollup";
import { tryReadConfig, type CLIOptions } from "@/configuration";

async function run(args: string[]) {
    const [, ..._args] = args;

    const pkgJson = Json.readJSONSync<IPackageJson>(CONSTANTS.packageJson);
    const beatsPkgJson = Json.readJSONSync<IPackageJson>(
        nodePath.resolve(require.resolve(".."), "../../package.json"),
    );

    const options = parser<CLIOptions>(_args);

    // Load `.env` file if possible.
    loadEnv();

    log.info(`${colors.brightRed(beatsPkgJson.name)} v${beatsPkgJson.version}`);
    log.info(`tsconfig from ${options.project || CONSTANTS.tsconfig}`);

    // Read `tsconfig.json`
    const tsConfig = loadTsConfigJson(options.project ?? CONSTANTS.tsconfig);

    if (options.config) {
        log.info(`${beatsPkgJson.name} configuration from ${options.config}`);
    }

    // Load `beats.config.json`.
    const config = await tryReadConfig({
        configPath: options.config,
        pkgJson,
    });

    return startBundle({
        config: {
            ...config,
            ...options,
        },
        pkgJson,
        tsConfig,
    });
}

run(process.argv.slice(1))
    .then(() => {
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit();
    });
