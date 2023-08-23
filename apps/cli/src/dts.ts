import * as CONSTANTS from "@/constants";
import log from "@/log";
import { resolveDtsEntryFromEntry } from "@/utils";
import {
    Extractor,
    ExtractorConfig,
    ExtractorLogLevel,
    ExtractorMessage,
} from "@microsoft/api-extractor";
import { file as File, colors, ms } from "@nfts/nodeutils";
import nodeFs from "node:fs/promises";
import nodePath from "node:path";
import ts, {
    createIncrementalCompilerHost,
    createIncrementalProgram,
    sys,
    type CompilerOptions,
} from "typescript";

export function createCompilerProgram(
    tsConfigCompilerOptions: CompilerOptions,
    tsconfig: string,
): ts.BuilderProgram | undefined {
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
                console.error(
                    `onUnRecoverableConfigFileDiagnostic`,
                    diagnostic.messageText,
                );
            },
        },
    );

    const host = createIncrementalCompilerHost(tsConfigCompilerOptions);

    if (config) {
        return createIncrementalProgram({
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
    input: string;
    tsConfigFile?: string;
    dtsFileName?: string;
    watch?: boolean;
}

export async function dtsGen({
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

    const start = Date.now();

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
        const duration = Date.now() - start;
        const message = `${colors.bgBlack(
            colors.bold(nodePath.relative(process.cwd(), input)),
        )} ${colors.bold("->")} ${nodePath.relative(
            process.cwd(),
            trimmedFile,
        )} (${ms(duration)})`;

        log.info(message);
    }
}

