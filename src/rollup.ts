import {
    type Plugin,
    rollup,
    type RollupOptions,
    type RollupWatchOptions,
    watch,
} from "rollup";
import { clearScreen, cwd } from "./utils";
import commonjs from "@rollup/plugin-commonjs";
import eslint from "@rollup/plugin-eslint";
import nodeResolve from "@rollup/plugin-node-resolve";
import styles from "rollup-plugin-styles";
import { IPackageJson } from "@nfts/pkg-json";
import Module from "node:module";

export const EXTENSIONS = [
    ".js", //
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".mjs",
    ".cjs",
    ".mts",
    ".cts",
    ".node",
];

/**
 *
 * @desc Externals function for rollup.externals,
 * by default, all devDependencies and dependencies in package.json
 * will be ignored.
 *
 */
export const externalsGenerator = (
    externals: string[] = [],
    pkgJson: IPackageJson,
) => {
    const { dependencies = {}, devDependencies = {} } = pkgJson;
    const nativeModules = Module.builtinModules
        .concat(Module.builtinModules.map((m) => `node:${m}`))
        .concat(Object.keys(dependencies).concat(Object.keys(devDependencies)));

    return (id: string) => {
        if (externals?.includes(id)) {
            return true;
        }
        let isExtractExternal = false;
        if (nativeModules.includes(id)) {
            isExtractExternal = true;
        }
        return isExtractExternal;
    };
};

/**
 *
 * Default plugins.
 *
 *
 **/
export const applyPlugins = (
    extraPlugins: Plugin[] = [],
    options?: { sourcemap?: boolean },
) => {
    const defaultPlugins = [
        nodeResolve({
            rootDir: cwd(),
            preferBuiltins: false,
            extensions: EXTENSIONS,
        }),
        commonjs({ sourceMap: options?.sourcemap, extensions: EXTENSIONS }),
        styles({
            modules: true,
            autoModules: true,
            less: {
                javascriptEnabled: true,
            },
        }),
        eslint({}),
    ];

    return [...defaultPlugins, ...extraPlugins];
};

/**
 *
 * Get all bundle tasks.
 *
 */
export const bundle = async (options: RollupOptions | RollupOptions[]) => {
    let bundles: (() => Promise<void>)[] = [];

    if (!Array.isArray(options)) {
        options = [options];
    }

    for await (const option of options) {
        const bundle_ = await rollup(option);
        let { output } = option;
        if (output) {
            if (output && !Array.isArray(output)) {
                output = [output];
            }

            const bundles_: (() => Promise<void>)[] = [];

            for (const output_ of output) {
                // Add bundle task
                bundles_.push(async () => {
                    await bundle_.generate(output_);
                    await bundle_.write(output_);
                });
            }

            bundles = bundles.concat(bundles_);
        } else {
            // TODO: Write warning to terminal
            return [];
        }
    }

    return bundles;
};

/**
 *
 * Dev process
 *
 */
export const watch_ = async (
    options: RollupWatchOptions | RollupWatchOptions[],
) => {
    const watcher = watch(options);

    let firstRun = true;

    await new Promise<void>((resolve, reject) => {
        watcher.on(`event`, (e) => {
            const code = e.code;
            switch (code) {
                case "START": {
                    clearScreen();
                    if (firstRun) {
                        console.log(`Start rollup watching bundle start.`);
                    }
                    break;
                }
                case "BUNDLE_END": {
                    break;
                }
                case "BUNDLE_START": {
                    if (firstRun) {
                        console.log(`Rollup watching bundle start.`);
                    } else {
                        console.log(`Rollup watching bundle re-start.`);
                    }

                    break;
                }
                case "END": {
                    console.log("Rollup bundle end.");
                    firstRun = false;
                    break;
                }
                case "ERROR": {
                    console.error(`Rollup bundle error:`, e.error.message);
                    watcher.close().finally(() => {
                        reject();
                    });
                    break;
                }
            }
        });
    });
};
