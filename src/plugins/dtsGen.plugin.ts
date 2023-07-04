import {
    Extractor,
    ExtractorConfig,
    ExtractorLogLevel,
} from "@microsoft/api-extractor";
import { type ITSConfigJson } from "@nfts/tsc-json";
import { fileSystem } from "@nfts/utils";
import nodePath from "node:path";
import { type Plugin } from "rollup";
import ts, {
    type CompilerOptions,
    createCompilerHost,
    createProgram,
    sys,
} from "typescript";

export interface IDtsPluginOptions {
    tsConfigFile?: string;
    dtsFileName?: string;
}

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

export default function dtsGen(options?: IDtsPluginOptions): Plugin {
    let hasMultiInput = false;
    let onlyInput: string | undefined;
    let tsConfig: ITSConfigJson | undefined;
    let tsConfigPath = options?.tsConfigFile;

    return {
        name: "dtsGen",
        async buildStart(inputOptions) {
            const { input } = inputOptions;
            const inputEntries = Object.entries(input);

            if (inputEntries.length > 1) {
                hasMultiInput = true;
                console.warn(
                    `Multiple inputs are not supported by @microsoft/api-extractor, will skip the dts bundle`,
                );
                return;
            }

            const [entry] = inputEntries;

            onlyInput = entry[1];

            if (options?.tsConfigFile) {
                tsConfig = await fileSystem.readJSON(options.tsConfigFile);
            } else {
                const [tsConfigFile] = await fileSystem.findFile(
                    `tsconfig.json`,
                    process.cwd(),
                    {
                        fullpath: true,
                    },
                );

                if (tsConfigFile) {
                    tsConfigPath = tsConfigFile;
                    tsConfig = await fileSystem.readJSON(tsConfigFile);
                } else {
                    throw Error(
                        `Can't find tsconfig.json from current project`,
                    );
                }
            }
        },

        async writeBundle(outputOptions) {
            if (hasMultiInput) {
                // TODO: Better message.
                console.warn(`检查到有多个 input，无法生成 dts 文件`);
                return;
            }

            const { format } = outputOptions;

            if ([`esm`, `es`].includes(format.toLowerCase())) {
                const [packageJsonFullPath] = await fileSystem.findFile(
                    `package.json`,
                    process.cwd(),
                    {
                        fullpath: true,
                    },
                );

                if (onlyInput && packageJsonFullPath && tsConfig) {
                    const { compilerOptions = {} } = tsConfig;

                    const { declaration } = compilerOptions;
                    let { declarationDir } = compilerOptions;

                    if (!declaration) {
                        return;
                    }

                    if (!declarationDir) {
                        declarationDir = nodePath.dirname(onlyInput);
                    }

                    // 生成 dts
                    emitOnlyDeclarations(
                        {
                            declaration: true,
                            emitDeclarationOnly: true,
                            declarationDir: declarationDir,
                        },
                        typeof tsConfigPath === "string"
                            ? tsConfigPath
                            : "./tsconfig.json",
                    );

                    const basename = nodePath.basename(onlyInput);
                    const extname = nodePath.extname(onlyInput);

                    const mainEntry = nodePath.resolve(
                        declarationDir,
                        extname
                            ? basename.replace(extname, ".d.ts")
                            : `${basename}.d.ts`,
                    );

                    const trimmedFile = options?.dtsFileName ?? "./index.d.ts";

                    const config = ExtractorConfig.prepare({
                        configObjectFullPath: undefined,
                        packageJsonFullPath: packageJsonFullPath,
                        ignoreMissingEntryPoint: true,
                        configObject: {
                            projectFolder: process.cwd(),
                            compiler: {
                                tsconfigFilePath: options?.tsConfigFile,
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
                        showVerboseMessages: false,
                    });

                    if (extractorResult.succeeded) {
                        // TODO: Add verbose message
                    } else {
                        // TODO: Throw whe meet error
                        // console.warn(
                        //     `出错了`,
                        //     `${extractorResult.errorCount} errors`,
                        //     `${extractorResult.warningCount} warnings`,
                        // );
                    }
                }
            } else {
                // TODO: Add error message, dtsRollup is enabled,
                //  but format is not es or esm
            }
        },
    };
}
