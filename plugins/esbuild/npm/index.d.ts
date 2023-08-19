import type { Plugin as Plugin_2 } from 'rollup';
import { TransformOptions } from 'esbuild';

declare function esbuild({ options, tsConfigFile, }: IEsbuildPluginOptions): Plugin_2;
export default esbuild;

export declare interface IEsbuildPluginOptions {
    options?: TRollupTransformOptions;
    tsConfigFile: string;
}

export declare type TEsbuildTsx = "react" | "react-jsx" | "react-jsxdev" | "preserve";

export declare type TRollupTransformOptions = TransformOptions;

export { }
