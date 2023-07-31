import * as CONSTANTS from "@/constants";
import { cwd, printOutput, resolveDtsEntryFromEntry } from "@/utils";
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
import { file as File, json as Json } from "@nfts/nodeutils";
import { type ITSConfigJson } from "@nfts/tsc-json";
import nodePath from "node:path";
import ts, {
    createCompilerHost,
    createProgram,
    sys,
    type CompilerOptions,
} from "typescript";

export function createCompilerProgram(
    tsConfigCompilerOptions: CompilerOptions,
    tsconfig: string,
): ts.Program | undefined {
    // TODO：可配置来创建 incremental program
    const config = ts.getParsedCommandLineOfConfigFile(
        tsconfig,
        tsConfigCompilerOptions,
        {
            useCaseSensitiveFileNames: true,
            getCurrentDirectory: sys.getCurrentDirectory,
            readDirectory: sys.readDirectory,
            fileExists: sys.fileExists,
            readFile: sys.readFile,
            onUnRecoverableConfigFileDiagnostic: function (
                diagnostic: ts.Diagnostic,
            ): void {
                console.log(
                    `onUnRecoverableConfigFileDiagnostic`,
                    diagnostic.messageText,
                );
            },
        },
    );

    const host = createCompilerHost(tsConfigCompilerOptions);

    if (config) {
        return createProgram({
            host,
            options: config.options,
            rootNames: config.fileNames,
            projectReferences: config.projectReferences,
            configFileParsingDiagnostics:
                ts.getConfigFileParsingDiagnostics(config),
        });
    }
}

export function emitOnlyDeclarations(
    tsConfigCompilerOptions: CompilerOptions,
    tsconfig: string,
) {
    const program = createCompilerProgram(tsConfigCompilerOptions, tsconfig);
    // TODO：将同步写入优化成异步，多线程写入，优化编译时间
    if (program) {
        program.emit(undefined);
    }
}

export interface IDtsGenOptions {
    input: string;
    tsConfigFile?: string;
    dtsFileName?: string;
    watch?: boolean;
}

export async function dtsGen({
    watch,
    input,
    dtsFileName,
    tsConfigFile,
}: IDtsGenOptions) {
    let tsConfig: ITSConfigJson | undefined;
    let tsConfigPath = tsConfigFile;

    if (tsConfigFile) {
        tsConfig = await Json.readJSON(tsConfigFile);
    } else {
        const tsConfigFile = File.findFile(`tsconfig.json`, process.cwd());

        if (tsConfigFile) {
            tsConfigPath = tsConfigFile;
            tsConfig = await Json.readJSON(tsConfigFile);
        } else {
            throw Error(`Can't find tsconfig.json from current project`);
        }
    }

    if (tsConfig) {
        const { compilerOptions = {} } = tsConfig;
        const { declaration, declarationDir } = compilerOptions;

        const packageJsonFullPath = nodePath.resolve(
            cwd(),
            CONSTANTS.packagejson,
        );

        if (declaration) {
            // 生成 dts
            emitOnlyDeclarations(
                {
                    declaration: true,
                    emitDeclarationOnly: true,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    declarationDir: declarationDir!,
                },
                typeof tsConfigPath === "string"
                    ? tsConfigPath
                    : CONSTANTS.tsconfig,
            );

            const mainEntry = declarationDir
                ? resolveDtsEntryFromEntry(declarationDir, input)
                : input.replace(nodePath.extname(input), ".d.ts");

            const trimmedFile = dtsFileName || CONSTANTS.dtsEntry;

            const config = ExtractorConfig.prepare({
                configObjectFullPath: undefined,
                packageJsonFullPath: packageJsonFullPath,
                ignoreMissingEntryPoint: true,
                configObject: {
                    projectFolder: process.cwd(),
                    compiler: {
                        tsconfigFilePath: tsConfigFile,
                    },
                    mainEntryPointFilePath: mainEntry,
                    dtsRollup: {
                        enabled: true,
                        publicTrimmedFilePath: trimmedFile,
                    },
                    docModel: {
                        enabled: false,
                    },
                    tsdocMetadata: {
                        enabled: false,
                    },
                    messages: {
                        extractorMessageReporting: {
                            default: {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                logLevel: "none",
                            },
                        },
                    },
                },
            });

            const extractorResult = Extractor.invoke(config, {
                localBuild: true,
                showDiagnostics: false,
                showVerboseMessages: false,
                typescriptCompilerFolder: nodePath.join(
                    require.resolve("typescript"),
                    "../..",
                ),
            });

            if (extractorResult.succeeded) {
                // TODO: Add verbose message
            } else {
                // TODO: Throw whe meet error
            }

            if (!watch && declarationDir) {
                File.rmdirSync(declarationDir);
            }

            printOutput(input!, nodePath.relative(cwd(), trimmedFile));
        }
    }
}
