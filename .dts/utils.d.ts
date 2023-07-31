import { RollupOptions } from "rollup";
export declare const clearScreen: () => boolean;
export declare const cwd: () => string;
export declare const isSameRollupInput: (input1: RollupOptions["input"], input2: RollupOptions["input"]) => boolean;
/**
 * Convert "x1,x2,x3" to ["x1", "x2", "x3"]
 * @param input
 */
export declare const normalizeCliInput: (input: string) => string[];
export declare const depsInfo: () => void;
/**
 * Write bundle result to terminal.
 * @param input
 * @param output
 */
export declare function printOutput(input: string, output: string): void;
export declare function box(text: string): void;
export declare function measureSync(mark: string, task: () => void): void;
export declare function measure(mark: string, task: () => Promise<void>): Promise<void>;
export declare function resolveDtsEntryFromEntry(declarationDir: string, entry: string): string;
/**
 * Serialize async tasks.
 * @param tasks
 */
export declare function serialize(tasks: (() => Promise<any>)[]): Promise<void>;
