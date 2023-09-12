import {
    Transformer,
    TransformerManager,
    type TransformerOptions,
} from "@/Transformer";
import { cssMinify, exportCssWithInject } from "@/utils";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcss from "postcss";
import postcssImport from "postcss-import";
import postcssrc from "postcss-load-config";
import postcssModules from "postcss-modules";
import postcssUrl from "postcss-url";
import type { PluginContext } from "rollup";

export default class PostcssTransformer extends Transformer {
    manager: TransformerManager;

    constructor(manager: TransformerManager) {
        super();
        this.manager = manager;
    }

    test = () => true;

    private supportCssModules = (id: string) => /\.module\.[A-Za-z]+$/.test(id);

    async transform(
        code: string,
        id: string,
        ctx: PluginContext,
        options: TransformerOptions,
    ) {
        const { plugins, options: options_ } = await postcssrc();

        const _plugins = [];

        _plugins.push(postcssImport({}));
        _plugins.push(postcssUrl({}));
        _plugins.push(
            autoprefixer({
                // Always throw error, when option value is not valid.
                ignoreUnknownVersions: false,
            }),
        );

        const supportCssModule =
            options.cssModule || this.supportCssModules(id);

        if (supportCssModule) {
            _plugins.push(
                postcssModules({
                    getJSON: (_, _json) => {
                        this.manager.cssJson.set(id, _json);
                    },
                }),
            );
        }

        if (options.minify) {
            _plugins.push(cssnano({ preset: "default" }));
        }

        const { messages, css, map } = await postcss([
            ..._plugins,
            ...plugins,
        ]).process(code, {
            to: options_.to ?? id,
            from: options_.from ?? id,
            map: options.sourcemap
                ? { inline: options.sourcemap === "inline" }
                : undefined,
            parser: options_.parser,
            syntax: options_.syntax,
            stringifier: options_.stringifier,
        });

        this.manager.cssById.set(id, css);

        const deps = this.manager.depsById.get(id) ?? new Set<string>();

        for (const message of messages) {
            if (message.type === "warning") {
                ctx.warn({
                    message: message.text,
                    loc: { column: message.column, line: message.line },
                });
            }

            if (message.type === "dependency") {
                const { file } = message;
                deps.add(file);
            }
        }

        this.manager.depsById.set(id, deps);

        const nanocss = await cssMinify(css, id);

        const _css = exportCssWithInject(
            nanocss,
            this.manager.cssJson.get(id) ?? {},
            supportCssModule,
        );

        return {
            map: options.sourcemap ? map.toString() : { mappings: "" as const },
            code: _css,
        };
    }
}
