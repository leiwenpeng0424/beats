/**
 *
 * utils
 *
 */
export declare const clearScreen: () => boolean;
export declare const cwd: () => string;
export declare const parser: <T extends object = Record<string, string | boolean>>(input: string[]) => T;
export declare const headers: ({
    value: string;
    headerColor: string;
    color: string;
    align: string;
    width: string;
} | {
    value: string;
    width: string;
    headerColor: string;
    color: string;
    align?: undefined;
})[];
