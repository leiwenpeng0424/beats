import { Plugin as Plugin_2 } from 'rollup';

declare function stylesPlugin(options?: TransformerOptions): Plugin_2;
export default stylesPlugin;

declare interface TransformerOptions {
    sourcemap?: boolean | "inline";
    extract?: boolean | string;
    cssModule?: boolean;
    minify?: boolean;
    include?: string[];
    exclude?: string[];
}

export { }
