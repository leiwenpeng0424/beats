import cssnano from "cssnano";

/**
 * Generate export for rollup transform.
 */
export function exportCssWithInject(
    css: string,
    cssInJson: Record<string, string>,
    cssModuleEnabled: boolean,
): string {
    const runtime = require.resolve("../runtime/injectCss.js");

    return [
        `import inject from "${runtime}";`,
        `inject(\`${css}\`);`,
        cssModuleEnabled ? `export default ${JSON.stringify(cssInJson)}` : "",
    ].join("\n\r");
}

export async function cssMinify(css: string, id: string) {
    const minifier = cssnano({
        preset: "default",
    });
    const result = await minifier.process(css, {
        from: id,
        to: id,
        map: false,
    });

    return result.css;
}
