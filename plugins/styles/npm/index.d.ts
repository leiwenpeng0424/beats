import { Plugin as Plugin_2 } from 'rollup';

export declare function styles(options?: TransformerOptions): Plugin_2;

declare interface TransformerOptions {
    sourcemap?: boolean | "inline";
    extract?: boolean | string;
    cssModule?: boolean;
    minify?: boolean;
    include?: string[];
    exclude?: string[];
}

export { }
