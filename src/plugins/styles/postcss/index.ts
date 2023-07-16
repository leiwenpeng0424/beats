import postcssModules from "postcss-modules";
import postcss from "postcss";
import postcssrc from "postcss-load-config";
import { type PluginContext, type TransformResult } from "rollup";

const test = /(\.pcss|\.css)$/;

const injectCssTag = `(function(css, namedExports) {
    if (!css || typeof document === "undefined") return;
    var container = document.getElementsByTagName("head")[0];
    var styleTag = document.createElement("style");
    styleTag.setAttribute("type", "text/css");
    container.insertAdjacentElement("afterbegin", styleTag);
    // strip potential UTF-8 BOM if css was read from a file
    if (css.charCodeAt(0) === 0xfeff) css = css.substring(1);
    if (styleTag.styleSheet) {
        styleTag.styleSheet.cssText += css;
    } else {
        styleTag.appendChild(document.createTextNode(css));
    }

    return namedExports;
})`;

export default async function postcssLoader(
    code: string,
    id: string,
    ctx: PluginContext,
    options: {
        cssById: Record<string, string>;
        cssMapById: Record<string, string>;
        cssModulesJsonById: Record<string, object>;
    },
): Promise<TransformResult> {
    if (!test.test(id)) {
        return null;
    }

    const { plugins, options: postcssOptions } = await postcssrc({});

    const result = await postcss([
        postcssModules({
            getJSON(filename, json) {
                options.cssModulesJsonById[id] = json;
            },
        }),
        ...plugins,
        // tailwindcss({ content: [id] }),
    ]).process(code, {
        to: id,
        from: id,
        map: { inline: false },
        ...postcssOptions,
    });

    let exports: Record<string, object> = {};
    const { messages, css, map } = result;

    options.cssById[id] = css;
    options.cssMapById[id] = map.toString();

    for (const message of messages) {
        if (message.plugin === "postcss-modules") {
            exports = message.exportTokens;
        }
    }

    for (const warning of result.warnings()) {
        ctx.warn(warning.text);
    }

    let outputCss = ``;

    outputCss += `export default ${injectCssTag}(${JSON.stringify(
        css,
    )}, ${JSON.stringify(exports)});`;

    return {
        code: outputCss,
        /**
         * Allow css injection code.
         */
        moduleSideEffects: "no-treeshake",
        map: map?.toString() ?? { mappings: "" },
    };
}
