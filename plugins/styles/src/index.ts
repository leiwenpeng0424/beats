import type { AcceptedPlugin } from "postcss";
import type { Config } from "postcss-load-config";
import type { Plugin } from "rollup";

export interface RollupPostcssOptions extends Omit<Config, "plugins"> {
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

    /**
     * Sourcemap for css.
     */
    sourcemap?: boolean;
}

export default function postcssPlugin(): Plugin {
    return {
        name: "styles",
    };
}

