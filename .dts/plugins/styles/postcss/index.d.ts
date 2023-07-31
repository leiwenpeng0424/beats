import { type PluginContext, type TransformResult } from "rollup";
export default function postcssLoader(code: string, id: string, ctx: PluginContext, options: {
    cssById: Record<string, string>;
    cssMapById: Record<string, string>;
    cssModulesJsonById: Record<string, object>;
}): Promise<TransformResult>;
