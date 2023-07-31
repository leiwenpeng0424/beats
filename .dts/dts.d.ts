import ts, { type CompilerOptions } from "typescript";
export declare function createCompilerProgram(tsConfigCompilerOptions: CompilerOptions, tsconfig: string): ts.Program | undefined;
export declare function emitOnlyDeclarations(tsConfigCompilerOptions: CompilerOptions, tsconfig: string): void;
export interface IDtsGenOptions {
    input: string;
    tsConfigFile?: string;
    dtsFileName?: string;
    watch?: boolean;
}
export declare function dtsGen({ watch, input, dtsFileName, tsConfigFile, }: IDtsGenOptions): Promise<void>;
