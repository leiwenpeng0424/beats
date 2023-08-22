import * as CONSTANTS from "@/constants";
import Terminal from "@/terminal";
import { resolveDtsEntryFromEntry } from "@/utils";
import {
    Extractor,
    ExtractorConfig,
    ExtractorLogLevel,
    ExtractorMessage,
} from "@microsoft/api-extractor";
import { file as File, colors } from "@nfts/nodeutils";
import nodeFs from "node:fs/promises";
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
            options: {
                ...config.options,
                noEmit: false,
            },
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
    if (program) {
        program.emit(undefined);
    }
}

export interface IDtsGenOptions {
    term: Terminal;
    input: string;
    tsConfigFile?: string;
    dtsFileName?: string;
    watch?: boolean;
}

export async function dtsGen({
    term,
    input,
    watch,
    dtsFileName,
    tsConfigFile = CONSTANTS.tsconfig,
}: IDtsGenOptions) {
    // PKG-JSON
    const packageJsonFullPath = nodePath.resolve(
        process.cwd(),
        CONSTANTS.packageJson,
    );

    emitOnlyDeclarations(
        {
            declaration: true,
            emitDeclarationOnly: true,
            declarationDir: CONSTANTS.dtsDir,
            incremental: true,
        },
        tsConfigFile,
    );

    const ext = nodePath.extname(input);

    const mainEntry = CONSTANTS.dtsDir
        ? resolveDtsEntryFromEntry(CONSTANTS.dtsDir, input)
        : ext
        ? input.replace(nodePath.extname(input), ".d.ts")
        : `${input}.d.ts`;

    const content = await nodeFs.readFile(mainEntry);

    // Fix #1
    if (content.toString() === "") {
        return;
    }

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
        messageCallback(message: ExtractorMessage) {
            message.logLevel = "none" as ExtractorLogLevel.None;
        },
    });

    if (extractorResult.succeeded) {
        // TODO: Add verbose message
    } else {
        // TODO: Throw whe meet error
    }

    File.rmdirSync(CONSTANTS.dtsDir);

    if (!watch) {
        const message = ` ✨ ${colors.bgBlack(
            colors.bold(nodePath.relative(process.cwd(), input)),
        )} ${colors.bold("->")} ${nodePath.relative(
            process.cwd(),
            trimmedFile,
        )}`;

        term.writeLine(message);
        term.nextLine();
        term.nextLine();
    }
}

