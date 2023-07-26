'use strict';

var nodeutils = require('@nfts/nodeutils');
var nodePath = require('node:path');
var nodeFs = require('node:fs/promises');
var esbuild$1 = require('esbuild');
var ts = require('typescript');
var apiExtractor = require('@microsoft/api-extractor');
var commonjs = require('@rollup/plugin-commonjs');
var eslint = require('@rollup/plugin-eslint');
var nodeResolve = require('@rollup/plugin-node-resolve');
var Module = require('node:module');
var rollup = require('rollup');
var styles = require('rollup-plugin-styles');

const verboseLog = (...args) => {
  if (process.env.BEATS_VERBOSE !== "undefined") {
    console.log(...args);
  }
};
const debugLog = (...args) => {
  if (process.env.BEATS_DEBUG !== "undefined") {
    console.debug(
      nodeutils.colors.bgBlack(nodeutils.colors.cyan(nodeutils.colors.bold("debug:"))),
      ...args
    );
  }
};

const clearScreen = () => process.stdout.write("\x1Bc");
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
const depsInfo = () => {
  const coreDeps = ["typescript", "esbuild", "rollup"];
  const depInfo = coreDeps.map((dep) => {
    const main = require.resolve(dep);
    const depDir = nodePath.join(main, "../../");
    const pkgJson = nodeutils.json.readJSONSync(
      nodePath.join(depDir, "package.json")
    );
    const { name, version } = pkgJson;
    return {
      name,
      version,
      path: depDir
    };
  }).reduce((infos, info) => {
    return infos += `${nodeutils.colors.green("*")} ${info.name}@${nodeutils.colors.green(
      info.version
    )} 
`;
  }, "");
  console.log("");
  verboseLog(depInfo);
};

var __knownSymbol$2 = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __forAwait$2 = (obj, it, method) => (it = obj[__knownSymbol$2("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol$2("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
const esmExt = [".mjs", ".mts"];
const cjsExt = [".cjs", ".cts"];
const esmMiddleNames = [".esm.", ".es."];
const cjsMiddleNames = [".cjs."];
const getFormatFromFileName = (output) => {
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
};
const getOutputFromPackageJson = (pkgJson, externalOutputOptions = (o) => o) => {
  const { main, module: m } = pkgJson;
  return [main, m].filter(Boolean).map((output) => {
    const format = getFormatFromFileName(output);
    if (output === ".") {
      output = "./index.js";
    }
    return externalOutputOptions({
      format,
      file: output
    });
  });
};
const Configs = ["beats.config.js", "beats.config.ts", "beats.config.json"];
const tryReadConfigFromRoot = async ({
  configPath,
  pkgJson
}) => {
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
};

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
    },
    writeBundle: {
      sequential: true,
      order: "post",
      async handler(output, bundle) {
        const files = Object.keys(bundle);
        for (const file of files) {
          const { facadeModuleId } = bundle[file];
          facadeModuleId && console.log(
            nodeutils.colors.bgGreen(
              nodeutils.colors.bold(
                nodeutils.colors.black(
                  nodePath.relative(
                    cwd(),
                    facadeModuleId
                  )
                )
              )
            ),
            "\u27A1\uFE0E",
            nodeutils.colors.cyan(file)
          );
        }
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
      options: config.options,
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
function dtsGen(options) {
  let onlyInput;
  let tsConfig;
  let tsConfigPath = options == null ? void 0 : options.tsConfigFile;
  return {
    name: "dtsGen",
    async buildStart(inputOptions) {
      const { input } = inputOptions;
      const inputEntries = Object.entries(input);
      if (inputEntries.length > 1) {
        this.warn(
          () => `Multiple inputs are not supported by @microsoft/api-extractor, will skip the dts bundle`
        );
      } else {
        const [entry] = inputEntries;
        onlyInput = entry[1];
        if (options == null ? void 0 : options.tsConfigFile) {
          tsConfig = await nodeutils.json.readJSON(options.tsConfigFile);
        } else {
          const tsConfigFile = nodeutils.file.findFile(
            `tsconfig.json`,
            process.cwd()
          );
          if (tsConfigFile) {
            tsConfigPath = tsConfigFile;
            tsConfig = await nodeutils.json.readJSON(tsConfigFile);
          } else {
            throw Error(
              `Can't find tsconfig.json from current project`
            );
          }
        }
      }
    },
    writeBundle: {
      async handler() {
        var _a;
        if (!onlyInput) {
          this.warn(
            () => `Multi entries is not allowed by @microsoft/api-extractor`
          );
        } else {
          const packageJsonFullPath = nodePath.join(
            cwd(),
            "package.json"
          );
          if (onlyInput && packageJsonFullPath && tsConfig) {
            const { compilerOptions = {} } = tsConfig;
            const { declaration } = compilerOptions;
            let { declarationDir } = compilerOptions;
            if (!declaration) {
              return;
            }
            if (!declarationDir) {
              declarationDir = nodePath.dirname(onlyInput);
            }
            emitOnlyDeclarations(
              {
                declaration: true,
                emitDeclarationOnly: true,
                declarationDir
              },
              typeof tsConfigPath === "string" ? tsConfigPath : "./tsconfig.json"
            );
            const basename = nodePath.basename(onlyInput);
            const extname = nodePath.extname(onlyInput);
            const mainEntry = nodePath.resolve(
              declarationDir,
              extname ? basename.replace(extname, ".d.ts") : `${basename}.d.ts`
            );
            const trimmedFile = (_a = options == null ? void 0 : options.dtsFileName) != null ? _a : "./index.d.ts";
            const config = apiExtractor.ExtractorConfig.prepare({
              configObjectFullPath: void 0,
              packageJsonFullPath,
              ignoreMissingEntryPoint: true,
              configObject: {
                projectFolder: process.cwd(),
                compiler: {
                  tsconfigFilePath: options == null ? void 0 : options.tsConfigFile
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
                },
                messages: {
                  extractorMessageReporting: {
                    default: {
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      logLevel: "none"
                    }
                  }
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
              )
            });
            if (extractorResult.succeeded) ;
            nodeutils.file.rmdirSync(declarationDir);
          }
        }
      }
    }
  };
}

var __defProp$2 = Object.defineProperty;
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
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
    tsConfigJson = nodeutils.json.readJSONSync(tsConfigFile);
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
      const ext = nodePath.extname(id);
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
      const result = await esbuild$1.transform(code, __spreadValues$2({
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
        const formattedDiagnostics = ts.formatDiagnosticsWithColorAndContext(tsErrors, {
          getCurrentDirectory: ts.sys.getCurrentDirectory,
          getCanonicalFileName: (fileName) => {
            return fileName;
          },
          getNewLine: () => {
            return ts.sys.newLine;
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

var __defProp$1 = Object.defineProperty;
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
const defaultEntry = "src/index";
const tsConfigFilePath$1 = "tsconfig.json";
const EXTENSIONS = [
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
    alias((_a = options == null ? void 0 : options.alias) != null ? _a : { alias: {} }),
    styles(options == null ? void 0 : options.styles),
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
          extensions: EXTENSIONS
        },
        (_b = options == null ? void 0 : options.nodeResolve) != null ? _b : {}
      )
    ),
    commonjs(
      Object.assign({ extensions: EXTENSIONS }, (_c = options == null ? void 0 : options.commonjs) != null ? _c : {})
    ),
    cleanup(options == null ? void 0 : options.clean),
    bundleProgress(),
    /**
     * @OPTIONAL
     * @NOTICE: Keep eslint plugins always at the bottom.
     */
    eslint(Object.assign({}, (_d = options == null ? void 0 : options.eslint) != null ? _d : {}))
  ].filter(Boolean);
};
const bundle = async (options) => {
  let bundles = [];
  if (!Array.isArray(options)) {
    options = [options];
  }
  try {
    for (var iter = __forAwait(options), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
      const option = temp.value;
      const bundle_ = await rollup.rollup(option);
      let { output } = option;
      if (output) {
        if (output && !Array.isArray(output)) {
          output = [output];
        }
        const bundles_ = [];
        for (const output_ of output) {
          bundles_.push(async () => {
            const start = Date.now();
            await bundle_.generate(output_);
            const output2 = await bundle_.write(output_);
            return __spreadProps$1(__spreadValues$1({}, output2), {
              input: option.input,
              duration: Date.now() - start
            });
          });
        }
        bundles = bundles.concat(bundles_);
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
const watch_ = async (options) => {
  const watcher = rollup.watch(options);
  let firstRun = true;
  let start;
  try {
    await new Promise(() => {
      watcher.on(`event`, (e) => {
        const code = e.code;
        switch (code) {
          case "START": {
            clearScreen();
            if (firstRun) {
              console.log(`Start rollup watching bundle.`);
            }
            start = (/* @__PURE__ */ new Date()).getTime();
            break;
          }
          case "BUNDLE_END": {
            break;
          }
          case "BUNDLE_START": {
            break;
          }
          case "END": {
            if (firstRun) {
              console.log(
                `Bundle end in ${nodeutils.ms(
                  ( new Date()).getTime() - start
                )}`
              );
            } else {
              console.log(
                `Re-bundle end ${nodeutils.ms(
                  ( new Date()).getTime() - start
                )}`
              );
            }
            firstRun = false;
            break;
          }
          case "ERROR": {
            console.error(`Rollup bundle error:`, e);
            break;
          }
        }
      });
    });
  } catch (e) {
  }
};
const startRollupBundle = async ({
  config,
  pkgJson,
  tsConfig
}) => {
  var _a, _b;
  const {
    externals,
    rollup: rollupOpt = {},
    input: configInput
    //
  } = config;
  const paths = (_b = (_a = tsConfig.compilerOptions) == null ? void 0 : _a.paths) != null ? _b : {};
  const {
    eslint: eslint2,
    commonjs: commonjs2,
    nodeResolve: nodeResolve2,
    esbuild: esbuild2,
    styles: styles2,
    minify,
    sourcemap,
    project,
    input: cliInput,
    watch: watch2
  } = config;
  const rollupPlugins = applyPlugins({
    eslint: eslint2,
    commonjs: commonjs2,
    nodeResolve: nodeResolve2,
    esbuild: Object.assign({ minify }, esbuild2 != null ? esbuild2 : {}),
    styles: styles2,
    alias: { alias: paths }
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
        input: bundleInput || configInput || (cliInput ? normalizeCliInput(cliInput) : defaultEntry),
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
  if (config.dtsRollup) {
    debugLog(`Enable dtsRollup`);
    if (pkgJson.types) {
      bundles.push(__spreadProps$1(__spreadValues$1({
        input: defaultEntry,
        output: { file: pkgJson.types, format: "esm" }
      }, rollupOptionWithoutInputOutput), {
        plugins: [
          dtsGen({
            tsConfigFile: project != null ? project : tsConfigFilePath$1,
            dtsFileName: pkgJson.types
          }),
          // Exclude eslint plugin for DTS bundle.
          ...rollupPlugins.slice(0, -1)
        ]
      }));
    } else {
      verboseLog(
        //
        `dtsRollup is enabled, but no 'types' or 'typings' field in package.json`
      );
    }
  }
  if (watch2) {
    await watch_(bundles);
  } else {
    await Promise.all((await bundle(bundles)).map((task) => task()));
  }
};

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
const tsConfigFilePath = "tsconfig.json";
const packageJsonFilePath = "package.json";
const cli = async (args) => {
  const [, ..._args] = args;
  const pkgJson = nodeutils.json.readJSONSync(packageJsonFilePath);
  const _a = nodeutils.parser(_args), {
    project,
    config: configPath,
    debug,
    verbose
  } = _a, restInputOptions = __objRest(_a, [
    "project",
    "config",
    "debug",
    "verbose"
  ]);
  process.env.BEATS_VERBOSE = verbose ? String(verbose) : "undefined";
  process.env.BEATS_DEBUG = debug ? String(debug) : "undefined";
  depsInfo();
  const tsConfig = nodeutils.json.readJSONSync(
    tsConfigFilePath 
  );
  debugLog(
    `tsconfig -> ${nodePath.join(cwd(), tsConfigFilePath )}
`
  );
  const config = await tryReadConfigFromRoot({
    configPath,
    pkgJson
  });
  return startRollupBundle({
    config: __spreadProps(__spreadValues(__spreadValues({}, config), restInputOptions), {
      project
    }),
    pkgJson,
    tsConfig
  });
};
cli(process.argv.slice(1)).then(() => {
}).catch((e) => {
  console.error(e);
});

function defineConfig(options) {
  return options;
}

exports.defineConfig = defineConfig;
