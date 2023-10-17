import log from "@/log";
import type { ITSConfigJson } from "@nfts/tsc-json";
import {
    parseJsonSourceFileConfigFileContent,
    readJsonConfigFile,
    sys,
} from "typescript";

export function loadTsConfigJson(path = "./tsconfig.json"): ITSConfigJson {
    try {
        const sourceFile = readJsonConfigFile(path, sys.readFile);
        const parsedCommandLine = parseJsonSourceFileConfigFileContent(
            sourceFile,
            {
                useCaseSensitiveFileNames: true,
                readDirectory: sys.readDirectory,
                readFile: sys.readFile,
                fileExists: sys.fileExists,
            },
            process.cwd(),
        );

        const { raw = {}, options } = parsedCommandLine;

        return {
            ...raw,
            compilerOptions: options,
        };
    } catch (e) {
        log.error(
            `Error while read tsconfig.json from ${path}, is tsconfig.json exist ?`,
        );
        process.exit(1);
    }
}
