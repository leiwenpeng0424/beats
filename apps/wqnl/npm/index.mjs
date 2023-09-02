import { m, Terminal, colors, file, ms, json, parser } from '@nfts/nodeutils';
import nodeFs from 'node:fs/promises';
import nodePath from 'node:path';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { ExtractorConfig, Extractor } from '@microsoft/api-extractor';
import ts, { sys, createIncrementalCompilerHost, createIncrementalProgram, readJsonConfigFile, parseJsonSourceFileConfigFileContent } from 'typescript';
import { alias } from '@nfts/plugin-alias';
import { cleanup } from '@nfts/plugin-cleanup';
import esbuild from '@nfts/plugin-esbuild';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import nodeResolve from '@rollup/plugin-node-resolve';
import Module from 'node:module';
import { rollup, watch } from 'rollup';
import styles from 'rollup-plugin-styles';

const tsconfig = "./tsconfig.json";
const packageJson = "./package.json";
const dtsEntry = "index.d.ts";
const output = "./index.js";
const input = "./src/index";
const outputDir = "npm";
const dtsDir = ".dts";
const esmExt = [".mjs", ".mts"];
const cjsExt = [".cjs", ".cts"];
const esmMiddleNames = [".esm.", ".es."];
const cjsMiddleNames = [".cjs.", ".node."];
const Extensions = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".node"
];

var __knownSymbol$1 = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
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
var __forAwait$1 = (obj, it, method) => (it = obj[__knownSymbol$1("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol$1("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
function getFormatFromFileName(output) {
  const ext = nodePath.extname(output);
  if (esmExt.includes(ext) || output.endsWith(".d.ts")) {
    return "es";
  }
  if (cjsExt.includes(ext)) {
    return "cjs";
  }
  if (esmMiddleNames.some((name) => output.includes(name))) {
    return "es";
  }
  if (cjsMiddleNames.some((name) => output.includes(name))) {
    return "cjs";
  }
  return "cjs";
}
function getOutputFromPackageJson(pkgJson, externalOutputOptions = (o) => o) {
  const { main, module: m2 } = pkgJson;
  return [main, m2].filter(Boolean).map((output$1) => {
    const format = getFormatFromFileName(output$1);
    if (output$1 === ".") {
      output$1 = output;
    }
    return externalOutputOptions({
      format,
      file: output$1,
      exports: "named"
    });
  });
}
const Configs = ["beats.config.js", "beats.config.ts", "beats.config.json"];
function defineConfig(options) {
  return options;
}
function tryReadConfig(_0) {
  return __async$4(this, arguments, function* ({
    configPath,
    pkgJson
  }) {
    const _cwd = process.cwd();
    let config;
    if (!configPath) {
      try {
        for (var iter = __forAwait$1(Configs), more, temp, error; more = !(temp = yield iter.next()).done; more = false) {
          const configFile = temp.value;
          try {
            const configFilePath = nodePath.join(_cwd, configFile);
            yield nodeFs.access(configFilePath);
            configPath = configFilePath;
            break;
          } catch (e) {
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
    }
    if (configPath) {
      config = m.import_(configPath);
      if (!config.bundle) {
        Object.assign(config, {
          bundle: getOutputFromPackageJson(
            pkgJson,
            config.bundleOverwrite
          )
        });
      }
      if (pkgJson.types) {
        Object.assign(config, { dtsRollup: true });
      }
      return config;
    } else {
      return {
        dtsRollup: !!pkgJson.types,
        bundle: getOutputFromPackageJson(pkgJson)
      };
    }
  });
}

function loadEnv(input = {}) {
  const config = dotenv.config({
    processEnv: input
  });
  dotenvExpand.expand(config);
}

var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Log {
  constructor({ term: term2 }) {
    __publicField(this, "term");
    this.term = term2;
  }
  info(text) {
    this.term.writeLine(
      `${colors.magenta(colors.bold("INFO"))} \u25B6\uFE0E ${text}`
    );
    term.nextLine();
  }
  debug(text) {
    if (process.env.DEBUG) {
      this.term.writeLine(
        `${colors.magenta(colors.bold("DEBUG"))} \u25B6\uFE0E ${text}`
      );
      term.nextLine();
    }
  }
  verbose(text) {
    if (process.env.VERBOSE) {
      this.term.writeLine(
        `${colors.magenta(colors.bold("VERBOSE"))} \u25B6\uFE0E ${text}`
      );
      term.nextLine();
    }
  }
  warn(text) {
    this.term.writeLine(`${colors.yellow(colors.bold("WARN"))} \u25B6\uFE0E ${text}`);
    term.nextLine();
  }
  error(text) {
    this.term.writeLine(
      `${colors.red(colors.bold("ERROR"))} \u25B6\uFE0E ${colors.bgRed(
        colors.black(` ${text} `)
      )}`
    );
    term.nextLine();
    term.nextLine();
  }
}
const term = new Terminal();
var log = new Log({ term });

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
const cwd = () => process.cwd();
const isSameRollupInput = (input1, input2) => {
  const type1 = typeof input1;
  const type2 = typeof input2;
  if (type1 !== type2) {
    return false;
  }
  if (Array.isArray(input1) && Array.isArray(input2)) {
    return input1.toString() === input2.toString();
  }
  return input1 === input2;
};
const normalizeCliInput = (input) => {
  return input.trimStart().trimEnd().split(",").filter(Boolean);
};
function resolveDtsEntryFromEntry(declarationDir, entry) {
  let entryUnshiftRoot = nodePath.join(cwd(), entry).replace(cwd() + nodePath.sep, "").split(nodePath.sep).slice(1).join(nodePath.sep).replace(".ts", ".d.ts");
  if (!entryUnshiftRoot.endsWith(".d.ts")) {
    entryUnshiftRoot += ".d.ts";
  }
  return nodePath.join(cwd(), declarationDir, entryUnshiftRoot);
}
function serialize(tasks) {
  return __async$3(this, null, function* () {
    return tasks.reduce((promise, next) => {
      return promise.then(() => {
        return next();
      });
    }, Promise.resolve());
  });
}

var __defProp$3 = Object.defineProperty;
var __defProps$2 = Object.defineProperties;
var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$3 = Object.getOwnPropertySymbols;
var __hasOwnProp$3 = Object.prototype.hasOwnProperty;
var __propIsEnum$3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$3 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$3.call(b, prop))
      __defNormalProp$3(a, prop, b[prop]);
  if (__getOwnPropSymbols$3)
    for (var prop of __getOwnPropSymbols$3(b)) {
      if (__propIsEnum$3.call(b, prop))
        __defNormalProp$3(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
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
function createCompilerProgram(tsConfigCompilerOptions, tsconfig) {
  const config = ts.getParsedCommandLineOfConfigFile(
    tsconfig,
    tsConfigCompilerOptions,
    {
      useCaseSensitiveFileNames: true,
      getCurrentDirectory: sys.getCurrentDirectory,
      readDirectory: sys.readDirectory,
      fileExists: sys.fileExists,
      readFile: sys.readFile,
      onUnRecoverableConfigFileDiagnostic: function(diagnostic) {
        console.error(
          `onUnRecoverableConfigFileDiagnostic`,
          diagnostic.messageText
        );
      }
    }
  );
  const host = createIncrementalCompilerHost(tsConfigCompilerOptions);
  if (config) {
    return createIncrementalProgram({
      host,
      options: __spreadProps$2(__spreadValues$3({}, config.options), {
        noEmit: false
      }),
      rootNames: config.fileNames,
      projectReferences: config.projectReferences,
      configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(config)
    });
  }
}
function emitOnlyDeclarations(tsConfigCompilerOptions, tsconfig) {
  const program = createCompilerProgram(tsConfigCompilerOptions, tsconfig);
  if (program) {
    program.emit(void 0);
  }
}
function dtsRollup(_0) {
  return __async$2(this, arguments, function* ({
    input,
    watch,
    dtsFileName,
    tsConfigFile = tsconfig
  }) {
    const packageJsonFullPath = nodePath.resolve(
      process.cwd(),
      packageJson
    );
    const start = Date.now();
    emitOnlyDeclarations(
      {
        declaration: true,
        emitDeclarationOnly: true,
        declarationDir: dtsDir,
        incremental: true
      },
      tsConfigFile
    );
    nodePath.extname(input);
    const mainEntry = resolveDtsEntryFromEntry(dtsDir, input) ;
    const content = yield nodeFs.readFile(mainEntry);
    if (content.toString() === "") {
      return;
    }
    const trimmedFile = dtsFileName || dtsEntry;
    const config = ExtractorConfig.prepare({
      configObjectFullPath: void 0,
      packageJsonFullPath,
      ignoreMissingEntryPoint: true,
      configObject: {
        projectFolder: process.cwd(),
        compiler: {
          tsconfigFilePath: tsConfigFile
        },
        mainEntryPointFilePath: mainEntry,
        dtsRollup: {
          enabled: true,
          publicTrimmedFilePath: trimmedFile
        },
        docModel: {
          enabled: false
        },
        tsdocMetadata: {
          enabled: false
        }
      }
    });
    const extractorResult = Extractor.invoke(config, {
      localBuild: true,
      showDiagnostics: false,
      showVerboseMessages: false,
      typescriptCompilerFolder: nodePath.join(
        require.resolve("typescript"),
        "../.."
      ),
      messageCallback(message) {
        message.logLevel = "none";
      }
    });
    if (extractorResult.succeeded) ;
    file.rmdirSync(dtsDir, false);
    if (!watch) {
      const duration = Date.now() - start;
      const message = `${colors.bgBlack(
        colors.bold(nodePath.relative(process.cwd(), input))
      )} ${colors.bold("->")} ${trimmedFile} (${ms(duration)})`;
      log.info(message);
    }
  });
}

var __defProp$2 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$2.call(b, prop))
      __defNormalProp$2(a, prop, b[prop]);
  if (__getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(b)) {
      if (__propIsEnum$2.call(b, prop))
        __defNormalProp$2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$2.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$2.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
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
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
const externalsGenerator = (externals = [], pkgJson) => {
  const { dependencies = {}, peerDependencies = {} } = pkgJson;
  const nativeModules = Module.builtinModules.concat(Module.builtinModules.map((m) => `node:${m}`)).concat(
    Object.keys(dependencies).concat(Object.keys(peerDependencies))
  );
  return (id) => {
    return (externals == null ? void 0 : externals.includes(id)) || nativeModules.includes(id);
  };
};
const applyPlugins = (options) => {
  var _a, _b, _c, _d;
  return [
    cleanup(options == null ? void 0 : options.clean),
    styles(options == null ? void 0 : options.styles),
    alias((_a = options == null ? void 0 : options.alias) != null ? _a : { alias: {} }),
    // @TODO
    // postcssPlugin({ cssModules: true }),
    esbuild(
      Object.assign({
        options: options == null ? void 0 : options.esbuild,
        tsConfigFile: nodePath.join(cwd(), "tsconfig.json")
      })
    ),
    nodeResolve(
      Object.assign(
        {
          rootDir: cwd(),
          preferBuiltins: false,
          extensions: Extensions
        },
        (_b = options == null ? void 0 : options.nodeResolve) != null ? _b : {}
      )
    ),
    commonjs(
      Object.assign(
        { extensions: Extensions },
        (_c = options == null ? void 0 : options.commonjs) != null ? _c : {}
      )
    ),
    eslint(Object.assign({}, (_d = options == null ? void 0 : options.eslint) != null ? _d : {}))
    // bundleProgress(),
  ].filter(Boolean);
};
const bundle = (_0) => __async$1(void 0, [_0], function* ({
  options,
  config,
  pkgJson
}) {
  const bundles = [];
  if (!Array.isArray(options)) {
    options = [options];
  }
  try {
    for (var iter = __forAwait(options), more, temp, error; more = !(temp = yield iter.next()).done; more = false) {
      const option = temp.value;
      const start = Date.now();
      const bundle_ = yield rollup(option);
      let { output } = option;
      const { input } = option;
      if (output) {
        if (output && !Array.isArray(output)) {
          output = [output];
        }
        for (const output_ of output) {
          bundles.push(() => __async$1(void 0, null, function* () {
            yield bundle_.generate(output_);
            const output2 = yield bundle_.write(output_);
            const duration = Date.now() - start;
            const message = `${colors.bgBlack(
              colors.bold(nodePath.relative(cwd(), input))
            )} ${colors.bold("->")} ${output_.file} (${ms(
              duration
            )})`;
            log.info(`${message}`);
            return __spreadProps$1(__spreadValues$2({}, output2), {
              duration
            });
          }));
        }
        bundles.push(() => __async$1(void 0, null, function* () {
          const start2 = Date.now();
          yield dts({
            config,
            pkgJson,
            input: option["input"]
          });
          return {
            // TODO: Add input value.
            input: "",
            duration: Date.now() - start2
          };
        }));
      } else {
        log.verbose(
          `Output not found for input '${option.input}', skip...`
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
  return bundles;
});
const watch_ = (_0, _1) => __async$1(void 0, [_0, _1], function* (options, {
  config,
  pkgJson
}) {
  const watcher = watch(options);
  let firstRun = true;
  try {
    yield new Promise(() => {
      watcher.on(`event`, (e) => {
        const { code } = e;
        switch (code) {
          case "START": {
            firstRun && log.info("Start watching process");
            break;
          }
          case "BUNDLE_START": {
            break;
          }
          case "BUNDLE_END": {
            const { input, output, duration } = e;
            log.info(
              `${input} -> ${output.map(
                (outputPath) => nodePath.relative(
                  process.cwd(),
                  outputPath
                )
              ).join(", ")}`
            );
            log.info(`Bundle end in ${ms(duration)}`);
            break;
          }
          case "END": {
            firstRun = false;
            const startTime = (/* @__PURE__ */ new Date()).getTime();
            const input = Array.isArray(options) ? options[0]["input"] : options.input;
            dts({
              input,
              config,
              pkgJson
            }).then(() => {
              log.info(`${input} -> ${pkgJson.types}`);
              log.info(
                `Dts end in ${ms(Date.now() - startTime)}`
              );
            });
            break;
          }
          case "ERROR": {
            log.error(e.error.message);
            break;
          }
        }
      }).on("change", (file) => {
        log.info(`changed: ${file}`);
      }).on("restart", () => log.info(`Restart`));
    });
  } catch (e) {
  }
});
function dts(_0) {
  return __async$1(this, arguments, function* ({
    input,
    config,
    pkgJson
  }) {
    var _a;
    const { module, main, types } = pkgJson;
    const output = module || main;
    const inputBasename = nodePath.basename(input);
    const outputBasepath = output ? nodePath.dirname(output) : outputDir;
    const ext = nodePath.extname(inputBasename);
    const outputBasename = ext ? inputBasename.replace(ext, ".d.ts") : `${inputBasename != null ? inputBasename : "index"}.d.ts`;
    if (config.dtsRollup) {
      yield dtsRollup({
        input,
        watch: config.watch,
        tsConfigFile: (_a = config.project) != null ? _a : tsconfig,
        dtsFileName: types || nodePath.resolve(cwd(), outputBasepath, outputBasename)
      });
    }
  });
}
function startBundle(_0) {
  return __async$1(this, arguments, function* ({
    config,
    pkgJson,
    tsConfig
  }) {
    var _a, _b, _c;
    const paths = (_b = (_a = tsConfig.compilerOptions) == null ? void 0 : _a.paths) != null ? _b : {};
    const {
      eslint: eslint2,
      commonjs: commonjs2,
      nodeResolve: nodeResolve2,
      esbuild: esbuild2,
      styles: styles2,
      rollup: rollupOpt = {},
      // Options
      externals,
      minify,
      sourcemap,
      input: cliInput,
      watch: watch2
    } = config;
    const rollupPlugins = applyPlugins({
      eslint: eslint2,
      commonjs: commonjs2,
      nodeResolve: nodeResolve2,
      esbuild: Object.assign(
        { minify, target: (_c = config.target) != null ? _c : "ES2015" },
        esbuild2 != null ? esbuild2 : {}
      ),
      styles: styles2,
      alias: { alias: paths }
      // clean: { active: !watch },
    });
    const externalsFn = externalsGenerator(externals, pkgJson);
    let bundles = [];
    const _d = rollupOpt, { plugins: extraPlugins = [] } = _d, rollupOpts = __objRest(_d, ["plugins"]);
    const rollupOptionWithoutInputOutput = __spreadValues$2({
      perf: true,
      treeshake: true,
      strictDeprecations: true,
      plugins: [...rollupPlugins, extraPlugins],
      external: externalsFn
    }, rollupOpts != null ? rollupOpts : {});
    if (config.bundle) {
      bundles = config.bundle.reduce((options, bundle2) => {
        const _a2 = bundle2, { input: bundleInput } = _a2, otherProps = __objRest(_a2, ["input"]);
        const option = __spreadValues$2({
          input: bundleInput || (cliInput ? normalizeCliInput(cliInput) : input),
          output: [__spreadProps$1(__spreadValues$2({}, otherProps), { sourcemap })]
        }, rollupOptionWithoutInputOutput);
        if (options.length === 0) {
          return [option];
        }
        const i = options.findIndex(
          (o) => isSameRollupInput(o.input, option.input)
        );
        if (i === -1) {
          options.push(option);
        } else {
          options[i] = Object.assign({}, options[i], {
            output: [
              ...options[i].output,
              __spreadProps$1(__spreadValues$2({}, otherProps), { sourcemap })
            ]
          });
        }
        return options;
      }, []);
    }
    if (watch2) {
      yield watch_(bundles, { config, pkgJson });
    } else {
      const tasks = yield bundle({
        options: bundles,
        config,
        pkgJson
      });
      yield serialize(tasks);
    }
  });
}

var __defProp$1 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$1.call(b, prop))
      __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b)) {
      if (__propIsEnum$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function loadTsConfigJson(path = "./tsconfig.json") {
  try {
    const sourceFile = readJsonConfigFile(path, sys.readFile);
    const parsedCommandLine = parseJsonSourceFileConfigFileContent(
      sourceFile,
      {
        useCaseSensitiveFileNames: true,
        readDirectory: sys.readDirectory,
        readFile: sys.readFile,
        fileExists: sys.fileExists
      },
      process.cwd()
    );
    const { raw = {}, options } = parsedCommandLine;
    return __spreadProps(__spreadValues$1({}, raw), {
      compilerOptions: options
    });
  } catch (e) {
    log.error(
      `Error while read tsconfig.json from ${path}, is tsconfig.json exist ?`
    );
    process.exit(1);
  }
}

var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
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
function cli(args) {
  return __async(this, null, function* () {
    var _a;
    const [, ..._args] = args;
    const pkgJson = json.readJSONSync(packageJson);
    const beatsPkgJson = json.readJSONSync(
      nodePath.resolve(require.resolve(".."), "../../package.json")
    );
    const options = parser(_args);
    loadEnv();
    log.info(`@nfts/beats v${beatsPkgJson.version}`);
    log.info(`tsconfig from ${options.project || tsconfig}`);
    const tsConfig = loadTsConfigJson((_a = options.project) != null ? _a : tsconfig);
    if (options.project) {
      log.info(`beats config from ${options.project}`);
    }
    const config = yield tryReadConfig({
      configPath: options.config,
      pkgJson
    });
    return startBundle({
      config: __spreadValues(__spreadValues({}, config), options),
      pkgJson,
      tsConfig
    });
  });
}
cli(process.argv.slice(1)).then(() => {
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit();
});

export { defineConfig, tryReadConfig };
