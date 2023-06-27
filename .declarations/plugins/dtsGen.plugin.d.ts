import { type Plugin } from "rollup";
import ts, { type CompilerOptions } from "typescript";
export interface IDtsPluginOptions {
    tsConfigFile?: string;
    dtsFileName?: string;
}
export declare function createCompilerProgram(tsConfigCompilerOptions: CompilerOptions, tsconfig: string): ts.Program | undefined;
export declare function emitOnlyDeclarations(tsConfigCompilerOptions: CompilerOptions, tsconfig: string): void;
export default function dts(options?: IDtsPluginOptions): Plugin;
