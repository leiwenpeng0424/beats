import { tryReadConfig, type CLIOptions } from "@/configuration";
import * as CONSTANTS from "@/constants";
import loadEnv from "@/env";
import { startBundle } from "@/rollup";
import Terminal from "@/terminal";
import { loadTsConfigJson } from "@/tsconfig";
import { json as Json, colors, parser } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import nodePath from "node:path";

async function cli(args: string[]) {
    const [, ..._args] = args;
    const pkgJson = Json.readJSONSync<IPackageJson>(CONSTANTS.packageJson);

    const beatsPkgJson = Json.readJSONSync<IPackageJson>(
        nodePath.resolve(require.resolve(".."), "../../package.json"),
    );

    const term = new Terminal();

    const {
        project,
        config: configPath,
        ...inputOptions
    } = parser<CLIOptions>(_args);

    // Load `.env` file if possible.
    loadEnv();

    const isWatch = inputOptions.watch;

    // Show cli info box.
    if (!isWatch) {
        term.clearScreen().box([
            colors.red(`@nfts/beats(${beatsPkgJson.version})`),
        ]);
        // term.nextLine();
    }

    term.writeLine(`Read ts config from ${project || CONSTANTS.tsconfig}`);
    term.nextLine();

    // Read `tsconfig.json`
    const tsConfig = loadTsConfigJson(project ?? CONSTANTS.tsconfig);

    if (configPath) {
        term.writeLine(`Read beats config from ${configPath}`);
        term.nextLine();
    }

    // Load `beats.config.json`.
    const config = await tryReadConfig({
        configPath,
        pkgJson,
    });

    return startBundle({
        term,
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
