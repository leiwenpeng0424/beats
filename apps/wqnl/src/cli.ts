import { tryReadConfig, type CLIOptions } from "@/configuration";
import * as CONSTANTS from "@/constants";
import loadEnv from "@/env";
import log from "@/log";
import { startBundle } from "@/rollup";
import { loadTsConfigJson } from "@/tsconfig";
import { json as Json, parser } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import nodePath from "node:path";

async function cli(args: string[]) {
    const [, ..._args] = args;
    const pkgJson = Json.readJSONSync<IPackageJson>(CONSTANTS.packageJson);

    const beatsPkgJson = Json.readJSONSync<IPackageJson>(
        nodePath.resolve(require.resolve(".."), "../../package.json"),
    );

    const {
        project,
        config: configPath,
        ...inputOptions
    } = parser<CLIOptions>(_args);

    // Load `.env` file if possible.
    loadEnv();

    log.info(`@nfts/beats v${beatsPkgJson.version}`);
    log.info(`tsconfig from ${project || CONSTANTS.tsconfig}`);

    // Read `tsconfig.json`
    const tsConfig = loadTsConfigJson(project ?? CONSTANTS.tsconfig);

    if (configPath) {
        log.info(`beats config from ${configPath}`);
    }

    // Load `beats.config.json`.
    const config = await tryReadConfig({
        configPath,
        pkgJson,
    });

    return startBundle({
        config: {
            ...config,
            ...inputOptions,
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
