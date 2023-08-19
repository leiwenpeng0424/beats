import { type ITSConfigJson } from "@nfts/tsc-json";
import { transform, type Loader, type TransformOptions } from "esbuild";
import { extname } from "node:path";
import type { Plugin } from "rollup";
import {
    createCompilerHost,
    createProgram,
    formatDiagnosticsWithColorAndContext,
    getConfigFileParsingDiagnostics,
    getParsedCommandLineOfConfigFile,
    parseJsonSourceFileConfigFileContent,
    readJsonConfigFile,
    sys,
    type CompilerOptions,
    type Diagnostic,
    type Program,
} from "typescript";

function createCompilerProgram(
    compilerOptions: CompilerOptions,
    tsconfig: string,
) {
    const config = getParsedCommandLineOfConfigFile(tsconfig, compilerOptions, {
        useCaseSensitiveFileNames: true,
        getCurrentDirectory: sys.getCurrentDirectory,
        readDirectory: sys.readDirectory,
        fileExists: sys.fileExists,
        readFile: sys.readFile,
        onUnRecoverableConfigFileDiagnostic: (diagnostic: Diagnostic) => {
            console.log(
                `onUnRecoverableConfigFileDiagnostic`,
                diagnostic.messageText,
            );
        },
    });

    const host = createCompilerHost(compilerOptions);

    if (config) {
        return createProgram({
            host,
            options: {
                ...config.options,
                noEmit: false,
            },
            rootNames: config.fileNames,
            projectReferences: config.projectReferences,
            configFileParsingDiagnostics:
                getConfigFileParsingDiagnostics(config),
        });
    }
}

function loadTsConfigJson(path: string): ITSConfigJson {
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

export type TEsbuildTsx = "react" | "react-jsx" | "react-jsxdev" | "preserve";

const EsbuildLoaders = {
    ".js": "js",
    ".jsx": "jsx",
    ".ts": "ts",
    ".tsx": "tsx",
    ".json": "json",
};

export type TRollupTransformOptions = TransformOptions;

export interface IEsbuildPluginOptions {
    options?: TRollupTransformOptions;
    tsConfigFile: string;
}

export default function esbuild({
    options,
    tsConfigFile,
}: IEsbuildPluginOptions): Plugin {
    let tsErrors: Diagnostic[] = [];
    let program: Program | undefined;

    let tsConfigJson: ITSConfigJson | undefined;

    try {
        tsConfigJson = loadTsConfigJson(tsConfigFile);
    } catch (_) {}

    const tsconfigRaw = {
        compilerOptions: {
            extends: tsConfigJson?.extends,
            baseUrl: !!tsConfigJson?.compilerOptions?.baseUrl,
            target: tsConfigJson?.compilerOptions?.target as string,
            alwaysStrict: tsConfigJson?.compilerOptions?.alwaysStrict,
            importsNotUsedAsValues:
                tsConfigJson?.compilerOptions?.importsNotUsedAsValues,
            /**
             * JSX Part
             */
            jsx: tsConfigJson?.compilerOptions?.jsx as TEsbuildTsx,
            jsxFactory: tsConfigJson?.compilerOptions?.jsxFactory,
            jsxFragmentFactory:
                tsConfigJson?.compilerOptions?.jsxFragmentFactory,
            jsxImportSource: tsConfigJson?.compilerOptions?.jsxImportSource,

            paths: tsConfigJson?.compilerOptions?.paths,
            preserveValueImports:
                tsConfigJson?.compilerOptions?.preserveValueImports,
            useDefineForClassFields:
                tsConfigJson?.compilerOptions?.useDefineForClassFields,
        },
    };

    return {
        name: "esbuild",
        buildStart() {
            tsErrors.length = 0;
            // TODO: 使用 incremental program 性能优化
            program = createCompilerProgram(
                {
                    emitDeclarationOnly: true,
                    composite: true,
                },
                tsConfigFile,
            );
        },

        async transform(code: string, id: string) {
            const ext = extname(id);
            const loader = EsbuildLoaders[
                ext as keyof typeof EsbuildLoaders
            ] as Loader;

            if (!loader) {
                return null;
            }
            const sourceFile = program?.getSourceFile(id);

            if (sourceFile) {
                const diagnostics = [
                    ...(program?.getSemanticDiagnostics(sourceFile) ?? []),
                    ...(program?.getSyntacticDiagnostics(sourceFile) ?? []),
                    ...(program?.getDeclarationDiagnostics(sourceFile) ?? []),
                ];

                if (diagnostics.length > 0) {
                    tsErrors = tsErrors.concat(diagnostics);
                }
            }

            const result = await transform(code, {
                loader,
                target: "es5",
                sourcefile: id,
                treeShaking: true,
                tsconfigRaw,
                ...options,
            });

            return (
                result.code && {
                    code: result.code,
                    map: result.map || null,
                }
            );
        },

        buildEnd() {
            if (tsErrors.length > 0) {
                const formattedDiagnostics =
                    formatDiagnosticsWithColorAndContext(tsErrors, {
                        getCurrentDirectory: sys.getCurrentDirectory,
                        getCanonicalFileName: (fileName: string): string => {
                            return fileName;
                        },
                        getNewLine: (): string => {
                            return sys.newLine;
                        },
                    });

                this.error(formattedDiagnostics);
            }
        },
    };
}

