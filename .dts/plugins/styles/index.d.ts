import { Plugin } from "rollup";
import { AcceptedPlugin } from "postcss";
import { type Config } from "postcss-load-config";
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
export default function postcssPlugin(options: RollupPostcssOptions): Plugin;
