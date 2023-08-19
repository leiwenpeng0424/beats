import { createFilter } from '@rollup/pluginutils';
import nodePath from 'node:path';
import { render } from 'less';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import postcssrc from 'postcss-load-config';
import postcssModules from 'postcss-modules';
import postcssUrl from 'postcss-url';

const DefaultTransformerOptions = {
  cssModule: false,
  sourcemap: false,
  extract: false,
  minify: false
};
class Transformer {
}
class TransformerManager {
  transformers = [];
  cssById = /* @__PURE__ */ new Map();
  cssJson = /* @__PURE__ */ new Map();
  depsById = /* @__PURE__ */ new Map();
  add(t) {
    this.transformers.push(t);
    return this;
  }
  async transform(code, id, ctx, options = DefaultTransformerOptions) {
    const extname = nodePath.extname(id);
    let res = {
      code,
      map: { mappings: "" },
      moduleSideEffects: true,
      syntheticNamedExports: false,
      assertions: {},
      meta: {}
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
          options
        );
      }
    }
    return res;
  }
  isSupported(extname) {
    const transformerSupportedIndex = this.transformers.findIndex(
      (v) => v.test(extname)
    );
    if (extname === ".css") {
      return true;
    }
    return transformerSupportedIndex !== this.transformers.length - 1;
  }
}

class LessTransformer extends Transformer {
  manager;
  constructor(manager) {
    super();
    this.manager = manager;
  }
  test(extname) {
    return /\.less$/.test(extname);
  }
  async transform(code, id, ctx, options = DefaultTransformerOptions) {
    try {
      require.resolve("less");
    } catch (e) {
      ctx.error(
        `You need to install \`less\` package in order to process Less files`
      );
    }
    const { css, map, imports } = await render(code, {
      rootpath: process.cwd(),
      math: "strict",
      filename: id,
      strictImports: true,
      strictUnits: true,
      sourceMap: options.sourcemap ? {
        outputSourceFiles: true,
        sourceMapBasepath: nodePath.dirname(id),
        sourceMapFileInline: options.sourcemap === "inline"
      } : void 0,
      globalVars: {},
      modifyVars: {}
    });
    this.manager.depsById.set(id, new Set(imports));
    return {
      code: css,
      map: map ?? { mappings: "" }
    };
  }
}

function exportCssWithInject(css, cssInJson, cssModuleEnabled) {
  const runtime = require.resolve("../runtime/injectCss.js");
  return [
    `import inject from "${runtime}";`,
    `inject(\`${css}\`);`,
    `export default ${cssModuleEnabled ? JSON.stringify(cssInJson) : "{}"};`
  ].join("\n\r");
}
async function cssMinify(css, id) {
  const minifier = cssnano({
    preset: "default"
  });
  const result = await minifier.process(css, {
    from: id,
    to: id,
    map: false
  });
  return result.css;
}

class PostcssTransformer extends Transformer {
  manager;
  constructor(manager) {
    super();
    this.manager = manager;
  }
  test = () => true;
  supportCssModules = (id) => /\.module\.[A-Za-z]+$/.test(id);
  async transform(code, id, ctx, options) {
    const { plugins, options: options_ } = await postcssrc();
    const _plugins = [];
    _plugins.push(postcssImport({}));
    _plugins.push(postcssUrl({}));
    _plugins.push(
      autoprefixer({
        // Always throw error, when option value is not valid.
        ignoreUnknownVersions: false
      })
    );
    const supportCssModule = options.cssModule || this.supportCssModules(id);
    if (supportCssModule) {
      _plugins.push(
        postcssModules({
          getJSON: (_, _json) => {
            this.manager.cssJson.set(id, _json);
          }
        })
      );
    }
    if (options.minify) {
      _plugins.push(cssnano({ preset: "default" }));
    }
    const { messages, css, map } = await postcss([
      ..._plugins,
      ...plugins
    ]).process(code, {
      to: options_.to ?? id,
      from: options_.from ?? id,
      map: options.sourcemap ? { inline: options.sourcemap === "inline" } : void 0,
      parser: options_.parser,
      syntax: options_.syntax,
      stringifier: options_.stringifier
    });
    this.manager.cssById.set(id, css);
    const deps = this.manager.depsById.get(id) ?? /* @__PURE__ */ new Set();
    for (const message of messages) {
      if (message.type === "warning") {
        ctx.warn({
          message: message.text,
          loc: { column: message.column, line: message.line }
        });
      }
      if (message.type === "dependency") {
        const { file } = message;
        deps.add(file);
      }
    }
    this.manager.depsById.set(id, deps);
    const minifiedCss = await cssMinify(css, id);
    const _css = exportCssWithInject(
      minifiedCss,
      this.manager.cssJson.get(id) ?? {},
      supportCssModule
    );
    return {
      map: options.sourcemap ? map.toString() : { mappings: "" },
      code: _css
    };
  }
}

function stylesPlugin(options = DefaultTransformerOptions) {
  const filter = createFilter(options.include ?? [], options.exclude ?? [], {
    resolve: process.cwd()
  });
  const transformManager = new TransformerManager();
  transformManager.add(new LessTransformer(transformManager)).add(new PostcssTransformer(transformManager));
  return {
    name: "stylesheet",
    async transform(code, id) {
      if (!filter(id) || code.replace(/\s/g, "") === "") {
        return null;
      }
      const isSupported = transformManager.isSupported(
        nodePath.extname(id)
      );
      if (!isSupported) {
        return null;
      }
      const result = await transformManager.transform(
        code,
        id,
        this,
        options
      );
      if (!result)
        return null;
      const deps = transformManager.depsById.get(id);
      if (deps && deps.size > 0) {
        const depFiles = Array.from(deps);
        for (const dep of depFiles)
          this.addWatchFile(dep);
      }
      if (typeof result === "string") {
        return {
          code: result,
          map: { mappings: "" }
        };
      }
      const { code: _code, map } = result;
      return {
        code: _code,
        moduleSideEffects: !options.extract,
        map
      };
    }
  };
}

export { stylesPlugin as default };
