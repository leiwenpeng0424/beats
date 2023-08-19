import { verboseLog } from "@/log";
import { colors, json as Json } from "@nfts/nodeutils";
import type { IPackageJson } from "@nfts/pkg-json";
import nodePath from "node:path";
import type { RollupOptions } from "rollup";

// Clear screen.
export const clearScreen = () => process.stdout.write("\x1Bc");

// Current working directory.
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

export const depsInfo = () => {
    const coreDeps = ["typescript", "esbuild", "rollup"];

    const depInfo = coreDeps
        .map((dep) => {
            const main = require.resolve(dep);
            const depDir = nodePath.join(main, "../../");
            const pkgJson = Json.readJSONSync<IPackageJson>(
                nodePath.join(depDir, "package.json"),
            );

            const { name, version } = pkgJson;
            return {
                name,
                version,
                path: depDir,
            };
        })
        .reduce((infos, info) => {
            return (infos += `${colors.green("*")} ${info.name}@${colors.green(
                info.version,
            )} \n`);
        }, "");

    verboseLog(depInfo);
};

/**
 * Write bundle result to terminal.
 * @param input
 * @param output
 */
export function printOutput(input: string, output: string) {
    console.log(
        colors.bgBlack(
            colors.bold(colors.cyan(nodePath.relative(cwd(), input))),
        ),
        colors.cyan("➡︎"),
        colors.cyan(output),
    );
}

export function measureSync(mark: string, task: () => void) {
    performance.mark(`${mark} start`);
    task();
    performance.mark(`${mark} end`);

    const measure = performance.measure(
        `${mark} start to end`,
        `${mark} start`,
        `${mark} end`,
    );

    verboseLog(
        colors.bgBlack(
            colors.white(colors.bold(`${mark} duration: ${measure.duration}`)),
        ),
    );
}

export async function measure(mark: string, task: () => Promise<void>) {
    performance.mark(`${mark} start`);
    await task();
    performance.mark(`${mark} end`);

    const measure = performance.measure(
        `${mark} start to end`,
        `${mark} start`,
        `${mark} end`,
    );

    verboseLog(
        colors.bgBlack(
            colors.white(colors.bold(`${mark} duration: ${measure.duration}`)),
        ),
    );
}

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

/**
 * Split text by length.
 * @param str
 * @param len
 */
export function strSplitByLength(str: string, len: number): string[] {
    const result = str.match(new RegExp(`(.{1,${len}})`, "g"));
    return result ?? [];
}

/** @link https://github.com/chalk/strip-ansi/blob/main/index.js */
export function stripAnsi(
    text: string,
    { onlyFirst }: { onlyFirst: boolean } = { onlyFirst: true },
) {
    const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
    ].join("|");
    const regexp = new RegExp(pattern, onlyFirst ? undefined : "g");
    return text.replace(regexp, "");
}

