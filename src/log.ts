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
        console.debug("debug:", ...args);
    }
};
