import { type TransformOptions } from "esbuild";
import { Plugin } from "rollup";
export type TEsbuildTsx = "react" | "react-jsx" | "react-jsxdev" | "preserve";
export type TRollupTransformOptions = TransformOptions;
export interface IEsbuildPluginOptions {
    options?: TRollupTransformOptions;
    tsConfigFile: string;
}
export default function esbuild({ options, tsConfigFile, }: IEsbuildPluginOptions): Plugin;
