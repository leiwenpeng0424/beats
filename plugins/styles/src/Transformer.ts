import type { PluginContext, TransformResult } from "rollup";
import nodePath from "node:path";

export interface TransformerOptions {
    sourcemap?: boolean | "inline";
    extract?: boolean | string;
    cssModule?: boolean;
    minify?: boolean;
    include?: string[];
    exclude?: string[];
}

export const DefaultTransformerOptions: Partial<TransformerOptions> = {
    cssModule: false,
    sourcemap: false,
    extract: false,
    minify: false,
};

export abstract class Transformer {
    abstract manager: TransformerManager;
    abstract test(extname: string): boolean;
    abstract transform(
        code: string, //
        id: string,
        ctx: PluginContext,
        options: TransformerOptions,
    ): Promise<TransformResult>;
}

export class TransformerManager {
    readonly transformers: Transformer[] = [];
    readonly cssById: Map<string, string> = new Map();
    readonly cssJson: Map<string, Record<string, string>> = new Map();
    readonly depsById: Map<string, Set<string>> = new Map();

    public add(t: Transformer): TransformerManager {
        this.transformers.push(t);
        return this;
    }

    public async transform(
        code: string,
        id: string,
        ctx: PluginContext,
        options: TransformerOptions = DefaultTransformerOptions,
    ): Promise<TransformResult> {
        const extname = nodePath.extname(id);
        let res: TransformResult = {
            code,
            map: { mappings: "" as const },
            moduleSideEffects: true,
            syntheticNamedExports: false,
            assertions: {},
            meta: {},
        };

        for await (const transformer of this.transformers) {
            if (typeof res === "string") {
                res = { code: res };
            }

            if (transformer.test(extname)) {
                res = await transformer.transform(
                    res?.code || "",
                    id,
                    ctx,
                    options,
                );
            }
        }

        return res;
    }

    public isSupported(extname: string) {
        const transformerSupportedIndex = this.transformers.findIndex((v) =>
            v.test(extname),
        );

        // `.css` is supported by default.
        if (extname === ".css") {
            return true;
        }

        return transformerSupportedIndex !== this.transformers.length - 1;
    }
}

