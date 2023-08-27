import nodePath from "node:path";
import type { RollupOptions } from "rollup";

export const cwd = () => process.cwd();

export const isSameRollupInput = (
    input1: RollupOptions["input"],
    input2: RollupOptions["input"],
) => {
    const type1 = typeof input1;
    const type2 = typeof input2;

    if (type1 !== type2) {
        return false;
    }

    if (Array.isArray(input1) && Array.isArray(input2)) {
        return input1.toString() === input2.toString();
    }

    return input1 === input2;
};

/**
 * Convert "x1,x2,x3" to ["x1", "x2", "x3"]
 * @param input
 */
export const normalizeCliInput = (input: string) => {
    return input.trimStart().trimEnd().split(",").filter(Boolean);
};

export function resolveDtsEntryFromEntry(
    declarationDir: string,
    entry: string,
) {
    let entryUnshiftRoot = nodePath
        .join(cwd(), entry)
        .replace(cwd() + nodePath.sep, "")
        .split(nodePath.sep)
        .slice(1)
        .join(nodePath.sep)
        .replace(".ts", ".d.ts");

    if (!entryUnshiftRoot.endsWith(".d.ts")) {
        entryUnshiftRoot += ".d.ts";
    }

    return nodePath.join(cwd(), declarationDir, entryUnshiftRoot);
}

/**
 * Serialize async tasks.
 * @param tasks
 */
// eslint-disable-next-line
export async function serialize(tasks: (() => Promise<any>)[]) {
    return tasks.reduce((promise, next) => {
        return promise.then(() => {
            return next();
        });
    }, Promise.resolve());
}

