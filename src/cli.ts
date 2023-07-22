import type { IPackageJson } from "@nfts/pkg-json";
import { fileSystem } from "@nfts/utils";
import { type CLIOptions, tryReadConfigFromRoot } from "@/configuration";
import { startRollupBundle } from "@/rollup";
import { coreDepsInfo, parser } from "@/utils";
import type { ITSConfigJson } from "@nfts/tsc-json";

const tsConfigFilePath = "tsconfig.json";
const packageJsonFilePath = "package.json";

const cli = async (args: string[]) => {
    const [, ..._args] = args;
    const pkgJson = fileSystem.readJSONSync<IPackageJson>(packageJsonFilePath);
    const { config: configPath, project } = parser<CLIOptions>(_args);
    coreDepsInfo();
    const tsConfig = fileSystem.readJSONSync<ITSConfigJson>(
        tsConfigFilePath ?? project,
    );
    const config = await tryReadConfigFromRoot({
        configPath,
        pkgJson,
    });
    await startRollupBundle({ config, pkgJson, tsConfig });
};

cli(process.argv.slice(1))
    .then(() => {
        //
    })
    .catch((e) => {
        console.error(e);
    });
