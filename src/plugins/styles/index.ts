import { Plugin, TransformResult } from "rollup";
import { AcceptedPlugin } from "postcss";
import { type Config } from "postcss-load-config";
import { createFilter } from "@rollup/pluginutils";
import { cwd } from "../../utils";
import postcssLoader from "./postcss";

export interface RollupPostcssOptions extends Omit<Config, "plugins"> {
    sourcemap?: boolean;
    include?: string[];
    exclude?: string[];
    /**
     * Extract css into single css file.
     */
    extract?: boolean;

    /**
     * Enable css modules.
     */
    cssModules?: boolean;

    /**
     * Extra styles plugins.
     */
    plugins?: AcceptedPlugin[];
}

export default function postcssPlugin(options: RollupPostcssOptions): Plugin {
    const filter = createFilter(options.include, options.exclude, {
        resolve: cwd(),
    });

    // const generated: Map<string, any> = new Map();
    const cssModulesJsonById: Record<string, object> = {};
    const cssById: Record<string, string> = {};
    const cssMapById: Record<string, string> = {};

    const extracted = new Set<string>();

    return {
        name: "styles",
        async transform(code, id) {
            if (!filter(id)) {
                return null;
            }

            const loaders = [postcssLoader];

            let result: TransformResult;

            for await (const loader of loaders) {
                result = await loader(code, id, this, {
                    cssById,
                    cssModulesJsonById,
                    cssMapById,
                });

                if (result) {
                    break;
                }
            }

            return result;
        },
        async generateBundle() {
            // console.log("cssModulesJsonById\n", cssModulesJsonById);
            // console.log("cssById\n", cssById);
            // console.log("cssMapById\n", cssMapById);
        },
    };
}
