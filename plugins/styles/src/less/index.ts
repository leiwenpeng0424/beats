import { render } from "less";
import nodePath from "node:path";
import type { PluginContext, TransformResult } from "rollup";
import {
    DefaultTransformerOptions,
    Transformer,
    type TransformerManager,
    type TransformerOptions,
} from "../Transformer";

export default class LessTransformer extends Transformer {
    manager: TransformerManager;

    constructor(manager: TransformerManager) {
        super();
        this.manager = manager;
    }

    public test(extname: string): boolean {
        return /\.less$/.test(extname);
    }

    public async transform(
        code: string,
        id: string,
        ctx: PluginContext,
        options: TransformerOptions = DefaultTransformerOptions,
    ): Promise<TransformResult> {
        try {
            require.resolve("less");
        } catch (e) {
            ctx.error(
                `You need to install \`less\` package in order to process Less files`,
            );
        }

        const { css, map, imports } = await render(code, {
            rootpath: process.cwd(),
            math: "strict",
            filename: id,
            strictImports: true,
            strictUnits: true,
            sourceMap: options.sourcemap
                ? {
                      outputSourceFiles: true,
                      sourceMapBasepath: nodePath.dirname(id),
                      sourceMapFileInline: options.sourcemap === "inline",
                  }
                : undefined,
            globalVars: {},
            modifyVars: {},
        });

        this.manager.depsById.set(id, new Set<string>(imports));

        return {
            code: css,
            map: map ?? { mappings: "" as const },
        };
    }
}

