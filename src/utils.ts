import { RollupOptions } from "rollup";
import nodePath from "node:path";
import { fileSystem, colors } from "@nfts/utils";
import { IPackageJson } from "@nfts/pkg-json";
import { verboseLog } from "./log";

// Clear screen
export const clearScreen = () => process.stdout.write("\x1Bc");

// Current working directory
export const cwd = () => process.cwd();

// String start with '--' or '-'.
const isArgFlag = (input: string): boolean => /^-{1,2}/.test(input);

// Remove prefix '--' or '-'.
const strip = (input: string): string => input.replace(/^-{1,2}/, "");

// Simple cmd input parser.
export const parser = <T extends object = { [K: string]: string | boolean }>(
    input: string[],
): T => {
    const lastNonArgFlagIndex = input.findIndex((curr) => isArgFlag(curr));

    const _ = input.slice(
        0,
        lastNonArgFlagIndex === -1 ? 1 : lastNonArgFlagIndex,
    );

    return input
        .slice(_.length)
        .reduce((accumulator, arg, currentIndex, arr) => {
            const next = arr[currentIndex + 1];

            if (isArgFlag(arg)) {
                if (!next) {
                    Object.assign(accumulator, { [strip(arg)]: true });
                } else {
                    if (!isArgFlag(next)) {
                        Object.assign(accumulator, { [strip(arg)]: next });
                    } else {
                        Object.assign(accumulator, { [strip(arg)]: true });
                    }
                }
            }

            return accumulator;
        }, {} as T);
};

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

export const normalizeCLIInput = (input: string) => {
    return input.trimStart().trimEnd().split(",").filter(Boolean);
};

export const coreDepsInfo = () => {
    const coreDeps = ["typescript", "esbuild", "rollup"];

    const depInfo = coreDeps
        .map((dep) => {
            const main = require.resolve(dep);

            const depDir = nodePath.join(main, "../../");

            const pkgJson = fileSystem.readJSONSync<IPackageJson>(
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
            return (infos += `${info.name}@${colors.green(info.version)} `);
        }, "");

    verboseLog(depInfo);
};
