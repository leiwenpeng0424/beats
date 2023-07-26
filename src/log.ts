import { colors } from "@nfts/nodeutils";

/**
 * Verbose
 * @param args
 */
export const verboseLog = (...args: any[]) => {
    if (process.env.BEATS_VERBOSE !== "undefined") {
        console.log(...args);
    }
};

/**
 * Debug
 * @param args
 */
export const debugLog = (...args: any[]) => {
    if (process.env.BEATS_DEBUG !== "undefined") {
        console.debug(
            colors.bgBlack(colors.cyan(colors.bold("debug:"))),
            ...args,
        );
    }
};
