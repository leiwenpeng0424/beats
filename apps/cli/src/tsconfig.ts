import { ITSConfigJson } from "@nfts/tsc-json";
import {
    parseJsonSourceFileConfigFileContent,
    readJsonConfigFile,
    sys,
} from "typescript";

export function loadTsConfigJson(path = "./tsconfig.json"): ITSConfigJson {
    const sourceFile = readJsonConfigFile(path, sys.readFile);
    const parsedCommandLine = parseJsonSourceFileConfigFileContent(
        sourceFile,
        {
            useCaseSensitiveFileNames: true,
            readDirectory: sys.readDirectory,
            readFile: sys.readFile,
            fileExists: sys.fileExists,
        },
        ".",
    );

    const { raw = {}, options } = parsedCommandLine;

    return {
        ...raw,
        compilerOptions: options,
    };
}

