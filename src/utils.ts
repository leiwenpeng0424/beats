import { verboseLog } from "@/log";
import { IPackageJson } from "@nfts/pkg-json";
import { colors, json as Json } from "@nfts/nodeutils";
import nodePath from "node:path";
import { RollupOptions } from "rollup";

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

export function printOutput(input: string, output: string) {
    console.log(
        colors.bgCyan(
            colors.bold(colors.black(nodePath.relative(cwd(), input))),
        ),
        "➡︎",
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
