'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var pluginutils = require('@rollup/pluginutils');
var nodePath = require('node:path');
var less = require('less');
var cssnano = require('cssnano');
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');
var postcssImport = require('postcss-import');
var postcssrc = require('postcss-load-config');
var postcssModules = require('postcss-modules');
var postcssUrl = require('postcss-url');

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
var __async$4 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
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
  transform(_0, _1, _2) {
    return __async$4(this, arguments, function* (code, id, ctx, options = DefaultTransformerOptions) {
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
        for (var iter = __forAwait(this.transformers), more, temp, error; more = !(temp = yield iter.next()).done; more = false) {
          const transformer = temp.value;
          if (typeof res === "string") {
            res = { code: res };
          }
          if (transformer.test(extname)) {
            res = yield transformer.transform(
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
          more && (temp = iter.return) && (yield temp.call(iter));
        } finally {
          if (error)
            throw error[0];
        }
      }
      return res;
    });
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
var __async$3 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
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
  transform(_0, _1, _2) {
    return __async$3(this, arguments, function* (code, id, ctx, options = DefaultTransformerOptions) {
      try {
        require.resolve("less");
      } catch (e) {
        ctx.error(
          `You need to install \`less\` package in order to process Less files`
        );
      }
      const { css, map, imports } = yield less.render(code, {
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
    });
  }
}

var __async$2 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
function exportCssWithInject(css, cssInJson, cssModuleEnabled) {
  const runtime = require.resolve("../runtime/injectCss.js");
  return [
    `import inject from "${runtime}";`,
    `inject(\`${css}\`);`,
    `export default ${cssModuleEnabled ? JSON.stringify(cssInJson) : "{}"};`
  ].join("\n\r");
}
function cssMinify(css, id) {
  return __async$2(this, null, function* () {
    const minifier = cssnano({
      preset: "default"
    });
    const result = yield minifier.process(css, {
      from: id,
      to: id,
      map: false
    });
    return result.css;
  });
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async$1 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
class PostcssTransformer extends Transformer {
  constructor(manager) {
    super();
    __publicField(this, "manager");
    __publicField(this, "test", () => true);
    __publicField(this, "supportCssModules", (id) => /\.module\.[A-Za-z]+$/.test(id));
    this.manager = manager;
  }
  transform(code, id, ctx, options) {
    return __async$1(this, null, function* () {
      var _a, _b, _c, _d;
      const { plugins, options: options_ } = yield postcssrc();
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
      const { messages, css, map } = yield postcss([
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
      const minifiedCss = yield cssMinify(css, id);
      const _css = exportCssWithInject(
        minifiedCss,
        (_d = this.manager.cssJson.get(id)) != null ? _d : {},
        supportCssModule
      );
      return {
        map: options.sourcemap ? map.toString() : { mappings: "" },
        code: _css
      };
    });
  }
}

var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
function stylesPlugin(options = DefaultTransformerOptions) {
  var _a, _b;
  const filter = pluginutils.createFilter((_a = options.include) != null ? _a : [], (_b = options.exclude) != null ? _b : [], {
    resolve: process.cwd()
  });
  const transformManager = new TransformerManager();
  transformManager.add(new LessTransformer(transformManager)).add(new PostcssTransformer(transformManager));
  return {
    name: "stylesheet",
    transform(code, id) {
      return __async(this, null, function* () {
        if (!filter(id) || code.replace(/\s/g, "") === "") {
          return null;
        }
        const isSupported = transformManager.isSupported(
          nodePath.extname(id)
        );
        if (!isSupported) {
          return null;
        }
        const result = yield transformManager.transform(
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
      });
    }
  };
}

exports.default = stylesPlugin;
