import { createFilter } from "@rollup/pluginutils";
import nodePath from "node:path";
import { Plugin } from "rollup";
import {
    DefaultTransformerOptions,
    TransformerManager,
    type TransformerOptions,
} from "@/Transformer";
import LessTransformer from "@/less";
import PostcssTransformer from "@/postcss";

export default function stylesPlugin(
    options: TransformerOptions = DefaultTransformerOptions,
): Plugin {
    const filter = createFilter(options.include ?? [], options.exclude ?? [], {
        resolve: process.cwd(),
    });

    const transformManager = new TransformerManager();

    transformManager
        .add(new LessTransformer(transformManager))
        .add(new PostcssTransformer(transformManager));

    return {
        name: "stylesheet",
        async transform(code, id) {
            if (!filter(id) || code.replace(/\s/g, "") === "") {
                return null;
            }

            const isSupported = transformManager.isSupported(
                nodePath.extname(id),
            );

            if (!isSupported) {
                return null;
            }

            const result = await transformManager.transform(
                code,
                id,
                this,
                options,
            );

            if (!result) return null;

            const deps = transformManager.depsById.get(id);

            if (deps && deps.size > 0) {
                const depFiles = Array.from(deps);
                for (const dep of depFiles) this.addWatchFile(dep);
            }

            if (typeof result === "string") {
                return {
                    code: result,
                    map: { mappings: "" as const },
                };
            }

            const { code: _code, map } = result;

            return {
                code: _code,
                moduleSideEffects: !options.extract,
                map,
            };
        },
    };
}

