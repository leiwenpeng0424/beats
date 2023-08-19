import { module_, file, colors, ms, json, parser } from '@nfts/nodeutils';
import nodePath, { extname } from 'node:path';
import nodeFs from 'node:fs/promises';
import { transform } from 'esbuild';
import ts, { sys, createCompilerHost, createProgram, readJsonConfigFile, parseJsonSourceFileConfigFileContent, formatDiagnosticsWithColorAndContext } from 'typescript';
import { ExtractorConfig, Extractor } from '@microsoft/api-extractor';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import nodeResolve from '@rollup/plugin-node-resolve';
import Module from 'node:module';
import { rollup, watch } from 'rollup';
import styles from 'rollup-plugin-styles';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import readline from 'node:readline';

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

var __knownSymbol$2 = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __forAwait$2 = (obj, it, method) => (it = obj[__knownSymbol$2("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol$2("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
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
  const _cwd = cwd();
  let config;
  if (!configPath) {
    try {
      for (var iter = __forAwait$2(Configs), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
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
    config = module_.import_(configPath);
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

function bundleProgress() {
  let cur;
  const bundlesStatus = {};
  return {
    name: "bin",
    resolveId(id, importer, { isEntry }) {
      if (isEntry && !importer && nodePath.isAbsolute(id)) {
        cur = id;
        bundlesStatus[id] = {
          loaded: 0,
          parsed: 0
        };
      }
    },
    load() {
      if (bundlesStatus[cur]) {
        bundlesStatus[cur].loaded += 1;
      }
    },
    moduleParsed(moduleInfo) {
      const status = bundlesStatus[cur];
      if (status) {
        status.parsed += 1;
        if (process.stdout.isTTY) {
          const relativeModulePath = nodePath.relative(
            cwd(),
            moduleInfo.id
          );
          const output = `(${status.parsed}/${status.loaded}) ${relativeModulePath}`;
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(
            output.length > process.stdout.columns ? output.slice(0, process.stdout.columns - 1) : output
          );
        }
      }
    },
    generateBundle() {
      if (process.stdout.isTTY) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
      }
    }
  };
}

function cleanup({ active } = { active: true }) {
  return {
    name: "rmdir",
    version: "0.0.1",
    async generateBundle(output, _, isWrite) {
      if (active && !isWrite) {
        if (output.file) {
          const absPath = nodePath.join(cwd(), output.file);
          try {
            await nodeFs.access(absPath);
            await nodeFs.unlink(absPath);
            await nodeFs.unlink(`${absPath}.map`);
          } catch (e) {
          }
        }
      }
    }
  };
}

var __defProp$5 = Object.defineProperty;
var __defProps$3 = Object.defineProperties;
var __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$4 = Object.getOwnPropertySymbols;
var __hasOwnProp$4 = Object.prototype.hasOwnProperty;
var __propIsEnum$4 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$4 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$4.call(b, prop))
      __defNormalProp$5(a, prop, b[prop]);
  if (__getOwnPropSymbols$4)
    for (var prop of __getOwnPropSymbols$4(b)) {
      if (__propIsEnum$4.call(b, prop))
        __defNormalProp$5(a, prop, b[prop]);
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
      getCurrentDirectory: sys.getCurrentDirectory,
      readDirectory: sys.readDirectory,
      fileExists: sys.fileExists,
      readFile: sys.readFile,
      onUnRecoverableConfigFileDiagnostic: function(diagnostic) {
        console.log(
          `onUnRecoverableConfigFileDiagnostic`,
          diagnostic.messageText
        );
      }
    }
  );
  const host = createCompilerHost(tsConfigCompilerOptions);
  if (config) {
    return createProgram({
      host,
      options: __spreadProps$3(__spreadValues$4({}, config.options), {
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
  const packageJsonFullPath = nodePath.resolve(cwd(), packageJson);
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
    messageCallback(message2) {
      message2.logLevel = "none";
    }
  });
  if (extractorResult.succeeded) ;
  file.rmdirSync(dtsDir);
  const message = ` \u2728 ${colors.bgBlack(
    colors.bold(nodePath.relative(cwd(), input))
  )} ${colors.bold("->")} ${nodePath.relative(cwd(), trimmedFile)}`;
  term.writeLine(message);
  term.nextLine();
  term.nextLine();
}

var __defProp$4 = Object.defineProperty;
var __defProps$2 = Object.defineProperties;
var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
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
var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
function loadTsConfigJson(path = "./tsconfig.json") {
  const sourceFile = readJsonConfigFile(path, sys.readFile);
  const parsedCommandLine = parseJsonSourceFileConfigFileContent(
    sourceFile,
    {
      useCaseSensitiveFileNames: true,
      readDirectory: sys.readDirectory,
      readFile: sys.readFile,
      fileExists: sys.fileExists
    },
    "."
  );
  const { raw = {}, options } = parsedCommandLine;
  return __spreadProps$2(__spreadValues$3({}, raw), {
    compilerOptions: options
  });
}

var __defProp$3 = Object.defineProperty;
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
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
const EsbuildLoaders = {
  ".js": "js",
  ".jsx": "jsx",
  ".ts": "ts",
  ".tsx": "tsx",
  ".json": "json"
};
function esbuild({
  options,
  tsConfigFile
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  let tsErrors = [];
  let program;
  let tsConfigJson;
  try {
    tsConfigJson = loadTsConfigJson(tsConfigFile);
  } catch (_) {
  }
  const tsconfigRaw = {
    compilerOptions: {
      extends: tsConfigJson == null ? void 0 : tsConfigJson.extends,
      baseUrl: !!((_a = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _a.baseUrl),
      target: (_b = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _b.target,
      alwaysStrict: (_c = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _c.alwaysStrict,
      importsNotUsedAsValues: (_d = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _d.importsNotUsedAsValues,
      /**
       * JSX Part
       */
      jsx: (_e = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _e.jsx,
      jsxFactory: (_f = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _f.jsxFactory,
      jsxFragmentFactory: (_g = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _g.jsxFragmentFactory,
      jsxImportSource: (_h = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _h.jsxImportSource,
      paths: (_i = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _i.paths,
      preserveValueImports: (_j = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _j.preserveValueImports,
      useDefineForClassFields: (_k = tsConfigJson == null ? void 0 : tsConfigJson.compilerOptions) == null ? void 0 : _k.useDefineForClassFields
    }
  };
  return {
    name: "esbuild",
    buildStart() {
      tsErrors.length = 0;
      program = createCompilerProgram(
        {
          emitDeclarationOnly: true,
          composite: true
        },
        tsConfigFile
      );
    },
    async transform(code, id) {
      var _a2, _b2, _c2;
      const ext = extname(id);
      const loader = EsbuildLoaders[ext];
      if (!loader) {
        return null;
      }
      const sourceFile = program == null ? void 0 : program.getSourceFile(id);
      if (sourceFile) {
        const diagnostics = [
          ...(_a2 = program == null ? void 0 : program.getSemanticDiagnostics(sourceFile)) != null ? _a2 : [],
          ...(_b2 = program == null ? void 0 : program.getSyntacticDiagnostics(sourceFile)) != null ? _b2 : [],
          ...(_c2 = program == null ? void 0 : program.getDeclarationDiagnostics(sourceFile)) != null ? _c2 : []
        ];
        if (diagnostics.length > 0) {
          tsErrors = tsErrors.concat(diagnostics);
        }
      }
      const result = await transform(code, __spreadValues$2({
        loader,
        target: "es2017",
        sourcefile: id,
        treeShaking: true,
        tsconfigRaw
      }, options));
      return result.code && {
        code: result.code,
        map: result.map || null
      };
    },
    buildEnd() {
      if (tsErrors.length > 0) {
        const formattedDiagnostics = formatDiagnosticsWithColorAndContext(tsErrors, {
          getCurrentDirectory: sys.getCurrentDirectory,
          getCanonicalFileName: (fileName) => {
            return fileName;
          },
          getNewLine: () => {
            return sys.newLine;
          }
        });
        this.error(formattedDiagnostics);
      }
    }
  };
}

var __knownSymbol$1 = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __forAwait$1 = (obj, it, method) => (it = obj[__knownSymbol$1("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol$1("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
function alias({ alias: alias2 }) {
  const aliaNames = Object.keys(alias2);
  return {
    name: "alias",
    resolveId: {
      order: "pre",
      async handler(id, importer) {
        if (aliaNames.length === 0)
          return null;
        const aliaNamesMatched = aliaNames.filter(
          (name) => id.startsWith(name.replace(/\*/g, ""))
        );
        if (aliaNamesMatched.length === 0)
          return null;
        const matchedPathName = aliaNamesMatched[0];
        const matchedPathAlias = alias2[matchedPathName];
        let resolution;
        try {
          for (var iter = __forAwait$1(matchedPathAlias), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
            const path = temp.value;
            const pathStripStar = path.replace(/\*/g, "");
            const matchedPathNameStripStar = matchedPathName.replace(
              /\*/g,
              ""
            );
            const realId = nodePath.join(
              cwd(),
              `./${id.replace(
                matchedPathNameStripStar,
                pathStripStar
              )}`
            );
            resolution = await this.resolve(realId, importer, {
              skipSelf: true
            });
            if (resolution) {
              break;
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
        return resolution;
      }
    }
  };
}

var __defProp$2 = Object.defineProperty;
var __defProps$1 = Object.defineProperties;
var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$1.call(b, prop))
      __defNormalProp$2(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b)) {
      if (__propIsEnum$1.call(b, prop))
        __defNormalProp$2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
var __objRest$1 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$1.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$1.call(source, prop))
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
      const bundle_ = await rollup(option);
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
            const message = ` \u2728 ${colors.bgBlack(
              colors.bold(nodePath.relative(cwd(), input))
            )} ${colors.bold("->")} ${output_.file} (${ms(
              duration
            )})`;
            term.writeLine(message);
            term.nextLine();
            return __spreadProps$1(__spreadValues$1({}, output2), {
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
  const watcher = watch(options);
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
                  `Bundle end in ${ms(
                    ( new Date()).getTime() - startTime
                  )}`
                );
              } else {
                term.writeLine(
                  `Re-bundle end ${ms(
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
async function startRollupBundle({
  term,
  config,
  pkgJson,
  tsConfig
}) {
  var _a, _b;
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
    esbuild: Object.assign({ minify }, esbuild2 != null ? esbuild2 : {}),
    styles: styles2,
    alias: { alias: paths },
    clean: { active: !watch2 }
  });
  const externalsFn = externalsGenerator(externals, pkgJson);
  let bundles = [];
  const _c = rollupOpt, { plugins: extraPlugins = [] } = _c, rollupOpts = __objRest$1(_c, ["plugins"]);
  const rollupOptionWithoutInputOutput = __spreadValues$1({
    perf: true,
    treeshake: true,
    strictDeprecations: true,
    plugins: [...rollupPlugins, extraPlugins],
    external: externalsFn
  }, rollupOpts != null ? rollupOpts : {});
  if (config.bundle) {
    bundles = config.bundle.reduce((options, bundle2) => {
      const _a2 = bundle2, { input: bundleInput } = _a2, otherProps = __objRest$1(_a2, ["input"]);
      const option = __spreadValues$1({
        input: bundleInput || (cliInput ? normalizeCliInput(cliInput) : input),
        output: [__spreadProps$1(__spreadValues$1({}, otherProps), { sourcemap })]
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
            __spreadProps$1(__spreadValues$1({}, otherProps), { sourcemap })
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

function loadEnv(input) {
  const config = dotenv.config({
    processEnv: input
  });
  dotenvExpand.expand(config);
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
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
  const pkgJson = json.readJSONSync(packageJson);
  const beatsPkgJson = json.readJSONSync(
    nodePath.resolve(require.resolve(".."), "../../package.json")
  );
  const term = new Terminal();
  const _a = parser(_args), {
    project,
    config: configPath,
    debug = false,
    verbose = false
  } = _a, restInputOptions = __objRest(_a, [
    "project",
    "config",
    "debug",
    "verbose"
  ]);
  loadEnv({ DEBUG: String(debug), VERBOSE: String(verbose) });
  if (!restInputOptions.watch) {
    term.clearScreen().box([
      colors.red(`@nfts/beats(${beatsPkgJson.version})`)
    ]);
    term.nextLine();
  }
  const tsConfig = loadTsConfigJson(project != null ? project : tsconfig);
  const config = await tryReadConfig({
    configPath,
    pkgJson
  });
  return startRollupBundle({
    term,
    config: __spreadProps(__spreadValues(__spreadValues({}, config), restInputOptions), {
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

export { defineConfig, tryReadConfig };
//# sourceMappingURL=index.mjs.map
