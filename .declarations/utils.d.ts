import { RollupOptions } from "rollup";
export declare const clearScreen: () => boolean;
export declare const cwd: () => string;
export declare const parser: <T extends object = Record<string, string | boolean>>(input: string[]) => T;
export declare const isSameRollupInput: (input1: RollupOptions["input"], input2: RollupOptions["input"]) => boolean;
