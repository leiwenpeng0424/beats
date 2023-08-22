'use strict';

var nodeutils = require('@nfts/nodeutils');
var nodeFs = require('node:fs/promises');
var nodePath = require('node:path');
var dotenv = require('dotenv');
var dotenvExpand = require('dotenv-expand');
var cleanup = require('@nfts/plugin-cleanup');
var esbuild = require('@nfts/plugin-esbuild');
var bundleProgress = require('@nfts/plugin-progress');
var commonjs = require('@rollup/plugin-commonjs');
var eslint = require('@rollup/plugin-eslint');
var nodeResolve = require('@rollup/plugin-node-resolve');
var Module = require('node:module');
var rollup = require('rollup');
var apiExtractor = require('@microsoft/api-extractor');
var ts = require('typescript');
var alias = require('@nfts/plugin-alias');
var styles = require('@nfts/plugin-styles');
var readline = require('node:readline');

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
const cjsMiddleNames = [".cjs."];

var __knownSymbol$1 = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
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
  const { main, module: m } = pkgJson;
  return [main, m].filter(Boolean).map((output$1) => {
    const format = getFormatFromFileName(output$1);
    if (output$1 === ".") {
      output$1 = output;
    }
    return externalOutputOptions({
      format,
      file: output$1
    });
  });
}
const Configs = ["beats.config.js", "beats.config.ts", "beats.config.json"];
function defineConfig(options) {
  return options;
}
async function tryReadConfig({
  configPath,
  pkgJson
}) {
  const _cwd = process.cwd();
  let config;
  if (!configPath) {
    try {
      for (var iter = __forAwait$1(Configs), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
        const configFile = temp.value;
        try {
          const configFilePath = nodePath.join(_cwd, configFile);
          await nodeFs.access(configFilePath);
          configPath = configFilePath;
          break;
        } catch (e) {
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
  }
  if (configPath) {
    config = nodeutils.module_.import_(configPath);
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
}

function loadEnv(input = {}) {
  const config = dotenv.config({
    processEnv: input
  });
  dotenvExpand.expand(config);
}

const verboseLog = (...args) => {
  if (process.env.VERBOSE) {
    console.log(...args);
  }
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
async function serialize(tasks) {
  return tasks.reduce((promise, next) => {
    return promise.then(() => {
      return next();
    });
  }, Promise.resolve());
}
function strSplitByLength(str, len) {
  const result = str.match(new RegExp(`(.{1,${len}})`, "g"));
  return result != null ? result : [];
}
function stripAnsi(text, { onlyFirst } = { onlyFirst: true }) {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
  ].join("|");
  const regexp = new RegExp(pattern, onlyFirst ? void 0 : "g");
  return text.replace(regexp, "");
}

var __defProp$4 = Object.defineProperty;
var __defProps$3 = Object.defineProperties;
var __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$3 = Object.getOwnPropertySymbols;
var __hasOwnProp$3 = Object.prototype.hasOwnProperty;
var __propIsEnum$3 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$3 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$3.call(b, prop))
      __defNormalProp$4(a, prop, b[prop]);
  if (__getOwnPropSymbols$3)
    for (var prop of __getOwnPropSymbols$3(b)) {
      if (__propIsEnum$3.call(b, prop))
        __defNormalProp$4(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$3 = (a, b) => __defProps$3(a, __getOwnPropDescs$3(b));
function createCompilerProgram(tsConfigCompilerOptions, tsconfig) {
  const config = ts.getParsedCommandLineOfConfigFile(
    tsconfig,
    tsConfigCompilerOptions,
    {
      useCaseSensitiveFileNames: true,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      readDirectory: ts.sys.readDirectory,
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      onUnRecoverableConfigFileDiagnostic: function(diagnostic) {
        console.log(
          `onUnRecoverableConfigFileDiagnostic`,
          diagnostic.messageText
        );
      }
    }
  );
  const host = ts.createCompilerHost(tsConfigCompilerOptions);
  if (config) {
    return ts.createProgram({
      host,
      options: __spreadProps$3(__spreadValues$3({}, config.options), {
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
async function dtsGen({
  term,
  input,
  dtsFileName,
  tsConfigFile = tsconfig
}) {
  const packageJsonFullPath = nodePath.resolve(
    process.cwd(),
    packageJson
  );
  emitOnlyDeclarations(
    {
      declaration: true,
      emitDeclarationOnly: true,
      declarationDir: dtsDir
    },
    tsConfigFile
  );
  nodePath.extname(input);
  const mainEntry = resolveDtsEntryFromEntry(dtsDir, input) ;
  const content = await nodeFs.readFile(mainEntry);
  if (content.toString() === "") {
    return;
  }
  const trimmedFile = dtsFileName || dtsEntry;
  const config = apiExtractor.ExtractorConfig.prepare({
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
  const extractorResult = apiExtractor.Extractor.invoke(config, {
    localBuild: true,
    showDiagnostics: false,
    showVerboseMessages: false,
    typescriptCompilerFolder: nodePath.join(
      require.resolve("typescript"),
      "../.."
    ),
    messageCallback(message2) {
      message2.logLevel = "none";
    }
  });
  if (extractorResult.succeeded) ;
  nodeutils.file.rmdirSync(dtsDir);
  const message = ` \u2728 ${nodeutils.colors.bgBlack(
    nodeutils.colors.bold(nodePath.relative(process.cwd(), input))
  )} ${nodeutils.colors.bold("->")} ${nodePath.relative(process.cwd(), trimmedFile)}`;
  term.writeLine(message);
  term.nextLine();
  term.nextLine();
}

var __defProp$3 = Object.defineProperty;
var __defProps$2 = Object.defineProperties;
var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$2.call(b, prop))
      __defNormalProp$3(a, prop, b[prop]);
  if (__getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(b)) {
      if (__propIsEnum$2.call(b, prop))
        __defNormalProp$3(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
var __objRest$1 = (source, exclude) => {
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
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
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
      Object.assign({ extensions: Extensions }, (_c = options == null ? void 0 : options.commonjs) != null ? _c : {})
    ),
    eslint(Object.assign({}, (_d = options == null ? void 0 : options.eslint) != null ? _d : {})),
    bundleProgress()
  ].filter(Boolean);
};
const bundle = async ({
  term,
  options,
  config,
  pkgJson
}) => {
  const bundles = [];
  if (!Array.isArray(options)) {
    options = [options];
  }
  try {
    for (var iter = __forAwait(options), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
      const option = temp.value;
      const bundle_ = await rollup.rollup(option);
      let { output } = option;
      const { input } = option;
      if (output) {
        if (output && !Array.isArray(output)) {
          output = [output];
        }
        for (const output_ of output) {
          bundles.push(async () => {
            const start = Date.now();
            await bundle_.generate(output_);
            const output2 = await bundle_.write(output_);
            const duration = Date.now() - start;
            const message = ` \u2728 ${nodeutils.colors.bgBlack(
              nodeutils.colors.bold(nodePath.relative(cwd(), input))
            )} ${nodeutils.colors.bold("->")} ${output_.file} (${nodeutils.ms(
              duration
            )})`;
            term.writeLine(message);
            term.nextLine();
            return __spreadProps$2(__spreadValues$2({}, output2), {
              duration
            });
          });
        }
        bundles.push(async () => {
          const start = Date.now();
          await dts({ term, config, pkgJson, rollup: option });
          return {
            // TODO: Add input value.
            input: "",
            duration: Date.now() - start
          };
        });
      } else {
        verboseLog(`Output not found for input '${option.input}', skip...`);
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
  return bundles;
};
const watch_ = async (options, term, {
  bundleEnd,
  bundleStart,
  start,
  end,
  error
} = {}) => {
  const watcher = rollup.watch(options);
  let firstRun = true;
  let startTime;
  try {
    await new Promise(() => {
      watcher.on(`event`, (e) => {
        const code = e.code;
        switch (code) {
          case "START": {
            term.clearScreen();
            start == null ? void 0 : start();
            if (firstRun) {
              term.writeLine(`Start rollup watching bundle.`);
            }
            startTime = (/* @__PURE__ */ new Date()).getTime();
            break;
          }
          case "BUNDLE_START": {
            bundleStart == null ? void 0 : bundleStart();
            break;
          }
          case "BUNDLE_END": {
            bundleEnd == null ? void 0 : bundleEnd();
            break;
          }
          case "END": {
            end == null ? void 0 : end().finally(() => {
              if (firstRun) {
                term.writeLine(
                  `Bundle end in ${nodeutils.ms(
                    ( new Date()).getTime() - startTime
                  )}`
                );
              } else {
                term.writeLine(
                  `Re-bundle end ${nodeutils.ms(
                    ( new Date()).getTime() - startTime
                  )}`
                );
              }
              firstRun = false;
            });
            break;
          }
          case "ERROR": {
            error == null ? void 0 : error();
            term.clearScreen().writeLine(
              `Bundle Error: ${e.error.message}`
            );
            break;
          }
        }
      });
    });
  } catch (e) {
  }
};
async function dts({
  term,
  config,
  rollup: rollup2,
  pkgJson
}) {
  var _a;
  const { input } = rollup2;
  const { module, main, types } = pkgJson;
  const output = module || main;
  const inputBasename = nodePath.basename(input);
  const outputBasepath = output ? nodePath.dirname(output) : outputDir;
  const ext = nodePath.extname(inputBasename);
  const outputBasename = ext ? inputBasename.replace(ext, ".d.ts") : `${inputBasename != null ? inputBasename : "index"}.d.ts`;
  if (config.dtsRollup) {
    await dtsGen({
      term,
      input,
      tsConfigFile: (_a = config.project) != null ? _a : tsconfig,
      dtsFileName: types || nodePath.resolve(cwd(), outputBasepath, outputBasename)
    });
  }
}
async function startBundle({
  term,
  config,
  pkgJson,
  tsConfig
}) {
  var _a, _b, _c, _d;
  const paths = (_b = (_a = tsConfig.compilerOptions) == null ? void 0 : _a.paths) != null ? _b : {};
  const target = (_d = (_c = tsConfig.compilerOptions) == null ? void 0 : _c.target) != null ? _d : "es6";
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
    esbuild: Object.assign({ minify, target }, esbuild2 != null ? esbuild2 : {}),
    styles: styles2,
    alias: { alias: paths },
    clean: { active: !watch2 }
  });
  const externalsFn = externalsGenerator(externals, pkgJson);
  let bundles = [];
  const _e = rollupOpt, { plugins: extraPlugins = [] } = _e, rollupOpts = __objRest$1(_e, ["plugins"]);
  const rollupOptionWithoutInputOutput = __spreadValues$2({
    perf: true,
    treeshake: true,
    strictDeprecations: true,
    plugins: [...rollupPlugins, extraPlugins],
    external: externalsFn
  }, rollupOpts != null ? rollupOpts : {});
  if (config.bundle) {
    bundles = config.bundle.reduce((options, bundle2) => {
      const _a2 = bundle2, { input: bundleInput } = _a2, otherProps = __objRest$1(_a2, ["input"]);
      const option = __spreadValues$2({
        input: bundleInput || (cliInput ? normalizeCliInput(cliInput) : input),
        output: [__spreadProps$2(__spreadValues$2({}, otherProps), { sourcemap })]
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
            __spreadProps$2(__spreadValues$2({}, otherProps), { sourcemap })
          ]
        });
      }
      return options;
    }, []);
  }
  if (watch2) {
    await watch_(bundles, term, {
      async end() {
        await Promise.all(
          bundles.map(async (opts) => {
            await dts({
              term,
              config,
              pkgJson,
              rollup: opts
            });
          })
        );
      }
    });
  } else {
    const tasks = await bundle({
      options: bundles,
      config,
      pkgJson,
      term
    });
    await serialize(tasks);
  }
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class Terminal {
  constructor() {
    __publicField(this, "stdin", process.stdin);
    __publicField(this, "stdout", process.stdout);
    __publicField(this, "x");
    __publicField(this, "y");
    __publicField(this, "maxCols");
    __publicField(this, "rl");
    this.rl = readline.createInterface({
      input: this.stdin,
      output: this.stdout,
      historySize: 0,
      removeHistoryDuplicates: true,
      tabSize: 4,
      prompt: "",
      terminal: process.stdout.isTTY
    });
    const pos = this.rl.getCursorPos();
    this.x = pos.cols;
    this.y = pos.rows;
    this.maxCols = process.stdout.columns > 60 ? 60 : process.stdout.columns;
  }
  _write(content) {
    readline.clearScreenDown(this.stdin);
    const segments = strSplitByLength(content, this.maxCols);
    segments.forEach((text) => {
      this.rl.write(text);
      this.y += 1;
    });
    return this;
  }
  nextLine() {
    this.y += 1;
    this.rl.write("\r");
    return this;
  }
  clearLine(cb) {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1, () => {
      cb == null ? void 0 : cb();
    });
    return this;
  }
  writeSameLine(content) {
    this.clearLine(() => {
      this._write(content);
    });
    return this;
  }
  writeLine(content, options = {
    endWithNewLine: false
  }) {
    this._write(content);
    if (options.endWithNewLine) {
      this.nextLine();
    }
    return this;
  }
  clearScreen() {
    this.x = 0;
    this.y = 0;
    readline.cursorTo(this.stdin, this.x, this.y);
    readline.clearScreenDown(this.stdin);
    return this;
  }
  box(content) {
    this.nextLine();
    this.writeLine(
      `\u256D${Array(this.maxCols - 2).fill("\u2500").join("")}\u256E`
    );
    this.nextLine();
    const padding = 4;
    const writeCenter = (text) => {
      const originLen = text.length;
      const stripLen = stripAnsi(text).length;
      const len = stripAnsi(text).length - (originLen - stripLen) - 0;
      const restLen = this.maxCols - padding * 2;
      if (restLen < len) {
        strSplitByLength(text, restLen).forEach((t) => {
          writeCenter(t);
        });
      } else {
        const left = Math.ceil((restLen - len) / 2);
        const leftPadding = "\u2502" + Array(left + padding - 1).fill(" ").join("");
        const rightPadding = Array(restLen - left - len + padding - 1).fill(" ").join("") + "\u2502";
        this.writeLine(`${leftPadding}${text}${rightPadding}`);
        this.nextLine();
      }
    };
    const contents = [
      " ",
      typeof content === "string" ? content : content,
      " "
    ].flat();
    contents.forEach((t) => {
      writeCenter(t);
    });
    this.writeLine(
      `\u2570${Array(this.maxCols - 2).fill("\u2500").join("")}\u256F`
    );
    this.nextLine();
    return this;
  }
}

var __defProp$1 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
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
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
function loadTsConfigJson(path = "./tsconfig.json") {
  const sourceFile = ts.readJsonConfigFile(path, ts.sys.readFile);
  const parsedCommandLine = ts.parseJsonSourceFileConfigFileContent(
    sourceFile,
    {
      useCaseSensitiveFileNames: true,
      readDirectory: ts.sys.readDirectory,
      readFile: ts.sys.readFile,
      fileExists: ts.sys.fileExists
    },
    "."
  );
  const { raw = {}, options } = parsedCommandLine;
  return __spreadProps$1(__spreadValues$1({}, raw), {
    compilerOptions: options
  });
}

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
async function cli(args) {
  const [, ..._args] = args;
  const pkgJson = nodeutils.json.readJSONSync(packageJson);
  const beatsPkgJson = nodeutils.json.readJSONSync(
    nodePath.resolve(require.resolve(".."), "../../package.json")
  );
  const term = new Terminal();
  const _a = nodeutils.parser(_args), {
    project,
    config: configPath
  } = _a, inputOptions = __objRest(_a, [
    "project",
    "config"
  ]);
  loadEnv();
  const isWatch = inputOptions.watch;
  if (!isWatch) {
    term.clearScreen().box([
      nodeutils.colors.red(`@nfts/beats(${beatsPkgJson.version})`)
    ]);
  }
  term.writeLine(`Read ts config from ${project || tsconfig}`);
  term.nextLine();
  const tsConfig = loadTsConfigJson(project != null ? project : tsconfig);
  if (configPath) {
    term.writeLine(`Read beats config from ${configPath}`);
    term.nextLine();
  }
  const config = await tryReadConfig({
    configPath,
    pkgJson
  });
  return startBundle({
    term,
    config: __spreadProps(__spreadValues(__spreadValues({}, config), inputOptions), {
      project
    }),
    pkgJson,
    tsConfig
  });
}
cli(process.argv.slice(1)).then(() => {
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit();
});

exports.defineConfig = defineConfig;
exports.tryReadConfig = tryReadConfig;
//# sourceMappingURL=index.cjs.map
