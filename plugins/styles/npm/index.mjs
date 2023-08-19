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

var __defProp$2 = Object.defineProperty;
var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => {
  __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
const DefaultTransformerOptions = {
  cssModule: false,
  sourcemap: false,
  extract: false,
  minify: false
};
class Transformer {
}
class TransformerManager {
  constructor() {
    __publicField$2(this, "transformers", []);
    __publicField$2(this, "cssById", /* @__PURE__ */ new Map());
    __publicField$2(this, "cssJson", /* @__PURE__ */ new Map());
    __publicField$2(this, "depsById", /* @__PURE__ */ new Map());
  }
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
    try {
      for (var iter = __forAwait(this.transformers), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
        const transformer = temp.value;
        if (typeof res === "string") {
          res = { code: res };
        }
        if (transformer.test(extname)) {
          res = await transformer.transform(
            (res == null ? void 0 : res.code) || "",
            id,
            ctx,
            options
          );
        }
      }
    } catch (temp) {
      error = [temp];
    } finally {
      try {
        more && (temp = iter.return) && await temp.call(iter);
      } finally {
        if (error)
          throw error[0];
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

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class LessTransformer extends Transformer {
  constructor(manager) {
    super();
    __publicField$1(this, "manager");
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
      map: map != null ? map : { mappings: "" }
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

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class PostcssTransformer extends Transformer {
  constructor(manager) {
    super();
    __publicField(this, "manager");
    __publicField(this, "test", () => true);
    __publicField(this, "supportCssModules", (id) => /\.module\.[A-Za-z]+$/.test(id));
    this.manager = manager;
  }
  async transform(code, id, ctx, options) {
    var _a, _b, _c, _d;
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
      to: (_a = options_.to) != null ? _a : id,
      from: (_b = options_.from) != null ? _b : id,
      map: options.sourcemap ? { inline: options.sourcemap === "inline" } : void 0,
      parser: options_.parser,
      syntax: options_.syntax,
      stringifier: options_.stringifier
    });
    this.manager.cssById.set(id, css);
    const deps = (_c = this.manager.depsById.get(id)) != null ? _c : /* @__PURE__ */ new Set();
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
      (_d = this.manager.cssJson.get(id)) != null ? _d : {},
      supportCssModule
    );
    return {
      map: options.sourcemap ? map.toString() : { mappings: "" },
      code: _css
    };
  }
}

function stylesPlugin(options = DefaultTransformerOptions) {
  var _a, _b;
  const filter = createFilter((_a = options.include) != null ? _a : [], (_b = options.exclude) != null ? _b : [], {
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
