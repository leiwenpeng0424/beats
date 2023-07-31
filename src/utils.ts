import { verboseLog } from "@/log";
import { IPackageJson } from "@nfts/pkg-json";
import { colors, json as Json } from "@nfts/nodeutils";
import nodePath from "node:path";
import { RollupOptions } from "rollup";
import * as readline from "readline";

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
        colors.bgCyan(
            colors.bold(colors.black(nodePath.relative(cwd(), input))),
        ),
        "➡︎",
        colors.cyan(output),
    );
}

const v = "⏐";

export function box(text: string) {
    console.log(
        colors.cyan("╭") +
            Array(Math.round(process.stdout.columns - 2))
                .fill(colors.cyan("─"))
                .join("") +
            colors.cyan("╮"),
    );
    let s = "";

    const lineWidth = process.stdout.columns;
    const textLength = text.length;
    const emptyLength = Math.ceil(lineWidth - 2);
    const halfEmptyLength = Math.ceil((lineWidth - textLength - 2) / 2);

    s += colors.cyan(v);
    s += Array(emptyLength).fill(" ").join("");
    s += colors.cyan(v);
    s += colors.cyan(v);
    s += Array(halfEmptyLength).fill(" ").join("");
    s += colors.cyan(text);
    s += Array(halfEmptyLength).fill(" ").join("");
    s += colors.cyan(v);
    s += colors.cyan(v);
    s += Array(emptyLength).fill(" ").join("");
    s += colors.cyan(v);

    console.log(s);
    console.log(
        colors.cyan("╰") +
            Array(Math.round(process.stdout.columns - 2))
                .fill(colors.cyan("─"))
                .join("") +
            colors.cyan("╯"),
    );
    console.log("");
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
    const entryUnshiftRoot = nodePath
        .join(cwd(), entry)
        .replace(cwd() + "/", "")
        .split("/")
        .slice(1)
        .join("/")
        .replace(".ts", ".d.ts");

    return nodePath.join(cwd(), declarationDir, entryUnshiftRoot);
}
