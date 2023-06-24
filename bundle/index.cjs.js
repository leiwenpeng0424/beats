'use strict';

var nodePath = require('node:path');
var nodeFs = require('node:fs/promises');
var utils = require('@nfts/utils');
var rollup = require('rollup');
var commonjs = require('@rollup/plugin-commonjs');
var eslint = require('@rollup/plugin-eslint');
var nodeResolve = require('@rollup/plugin-node-resolve');
var styles = require('rollup-plugin-styles');
var Module = require('node:module');
var esbuild$1 = require('esbuild');
var ts = require('typescript');
var apiExtractor = require('@microsoft/api-extractor');

const cwd = () => process.cwd();
const isArgFlag = (input) => /^-{1,2}/.test(input);
const strip = (input) => input.replace(/^-{1,2}/, "");
const parser = (input) => {
  const lastNonArgFlagIndex = input.findIndex((curr) => isArgFlag(curr));
  const _ = input.slice(
    0,
    lastNonArgFlagIndex === -1 ? 1 : lastNonArgFlagIndex
  );
  return input.slice(_.length).reduce((accumulator, arg, currentIndex, arr) => {
    const next = arr[currentIndex + 1];
    if (isArgFlag(arg)) {
      if (!next) {
        Object.assign(accumulator, { [strip(arg)]: true });
      } else {
        if (!isArgFlag(next)) {
          Object.assign(accumulator, { [strip(arg)]: next });
        } else {
          Object.assign(accumulator, { [strip(arg)]: true });
        }
      }
    }
    return accumulator;
  }, {});
};

var __forAwait$1 = (obj, it, method) => {
  it = obj[Symbol.asyncIterator];
  method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((resolve, reject, done) => {
    arg = fn.call(obj, arg);
    done = arg.done;
    return Promise.resolve(arg.value).then((value) => resolve({ value, done }), reject);
  }));
  return it ? it.call(obj) : (obj = obj[Symbol.iterator](), it = {}, method("next"), method("return"), it);
};
const esmExt = [".mjs"];
const cjsExt = [".cjs"];
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
  const { main, module } = pkgJson;
  return [main, module].filter(Boolean).map((output) => {
    const format = getFormatFromFileName(output);
    return externalOutputOptions({
      format,
      file: output,
      input: defaultInputPath
    });
  });
};
const configs = ["beats.config.js", "beats.config.ts", "beats.config.json"];
const defaultInputPath = ["./src/index"];
const tryReadConfigFromRoot = async ({
  configPath,
  pkgJson
}) => {
  const _cwd = cwd();
  let config;
  if (!configPath) {
    try {
      for (var iter = __forAwait$1(configs), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
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
    config = utils.modulex.import_(configPath);
    if (!config.input) {
      Object.assign(config, { input: defaultInputPath });
    }
    if (!config.bundle) {
      Object.assign(config, {
        bundle: getOutputFromPackageJson(pkgJson)
      });
    }
    return config;
  } else {
    console.error(`No valid configuration`);
    process.exit(1);
  }
};

var __forAwait = (obj, it, method) => {
  it = obj[Symbol.asyncIterator];
  method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((resolve, reject, done) => {
    arg = fn.call(obj, arg);
    done = arg.done;
    return Promise.resolve(arg.value).then((value) => resolve({ value, done }), reject);
  }));
  return it ? it.call(obj) : (obj = obj[Symbol.iterator](), it = {}, method("next"), method("return"), it);
};
const EXTENSIONS = [
  ".js",
  //
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
  const { dependencies = {}, devDependencies = {} } = pkgJson;
  const nativeModules = Module.builtinModules.concat(Module.builtinModules.map((m) => `node:${m}`)).concat(Object.keys(dependencies).concat(Object.keys(devDependencies)));
  return (id) => {
    if (externals == null ? void 0 : externals.includes(id)) {
      return true;
    }
    let isExtractExternal = false;
    if (nativeModules.includes(id)) {
      isExtractExternal = true;
    }
    return isExtractExternal;
  };
};
const applyPlugins = (extraPlugins = [], options) => {
  const defaultPlugins = [
    nodeResolve({
      rootDir: cwd(),
      preferBuiltins: false,
      extensions: EXTENSIONS
    }),
    commonjs({ sourceMap: options == null ? void 0 : options.sourcemap, extensions: EXTENSIONS }),
    styles({
      modules: true,
      autoModules: true,
      less: {
        javascriptEnabled: true
      }
    }),
    eslint({})
  ];
  return [...defaultPlugins, ...extraPlugins];
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
            await bundle_.generate(output_);
            await bundle_.write(output_);
          });
        }
        bundles = bundles.concat(bundles_);
      } else {
        return [];
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
    program.emit(
      void 0
      // (filename: string, text: string) => {
      //     console.log(filename, text);
      // }
    );
  }
}
function dts(options) {
  let hasMultiInput = false;
  let singleInput;
  let tsConfig;
  let tsConfigPath = options == null ? void 0 : options.tsConfigFile;
  return {
    name: "dts",
    async buildStart(inputOptions) {
      const { input } = inputOptions;
      const inputEntries = Object.entries(input);
      if (inputEntries.length > 1) {
        hasMultiInput = true;
        return;
      }
      const [entry] = inputEntries;
      singleInput = entry[1];
      if (options == null ? void 0 : options.tsConfigFile) {
        tsConfig = await utils.fileSystem.readJSON(options.tsConfigFile);
      } else {
        const [tsConfigFile] = await utils.fileSystem.findFile(
          `tsconfig.json`,
          process.cwd(),
          {
            fullpath: true
          }
        );
        if (tsConfigFile) {
          tsConfigPath = tsConfigFile;
          tsConfig = await utils.fileSystem.readJSON(tsConfigFile);
        } else {
          throw Error(
            `Can't find tsconfig.json from current project`
          );
        }
      }
    },
    async writeBundle(outputOptions) {
      var _a;
      if (hasMultiInput) {
        console.warn(`\u68C0\u67E5\u5230\u6709\u591A\u4E2A input\uFF0C\u65E0\u6CD5\u751F\u6210 dts \u6587\u4EF6`);
        return;
      }
      const { format } = outputOptions;
      if ([`esm`, `es`].includes(format.toLowerCase())) {
        const [packageJsonFullPath] = await utils.fileSystem.findFile(
          `package.json`,
          process.cwd(),
          {
            fullpath: true
          }
        );
        if (singleInput && packageJsonFullPath && tsConfig) {
          const { compilerOptions = {} } = tsConfig;
          const { declaration } = compilerOptions;
          let { declarationDir } = compilerOptions;
          if (!declaration) {
            return;
          }
          if (!declarationDir) {
            declarationDir = nodePath.dirname(singleInput);
          }
          emitOnlyDeclarations(
            {
              declaration: true,
              emitDeclarationOnly: true,
              declarationDir
            },
            typeof tsConfigPath === "string" ? tsConfigPath : "./tsconfig.json"
          );
          const basename = nodePath.basename(singleInput);
          const extname = nodePath.extname(singleInput);
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
                compilerMessageReporting: {}
              }
            }
          });
          const extractorResult = apiExtractor.Extractor.invoke(config, {
            localBuild: true,
            showVerboseMessages: false
          });
          if (extractorResult.succeeded) ;
        }
      }
    }
  };
}

var __defProp$1 = Object.defineProperty;
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
  const tsConfigJson = utils.fileSystem.readJSONSync(tsConfigFile);
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
      const result = await esbuild$1.transform(code, __spreadValues$1({
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
const packageFilePath = "package.json";
const cli = async (args) => {
  const [, ..._args] = args;
  const pkgJson = utils.fileSystem.readJSONSync(packageFilePath);
  const { sourcemap, configFile, project } = parser(_args);
  const config = await tryReadConfigFromRoot({
    configPath: configFile,
    pkgJson
  });
  const internalPlugins = [];
  const rollupPlugins = applyPlugins(internalPlugins, { sourcemap });
  rollupPlugins.unshift(
    esbuild({
      options: config.esbuild,
      tsConfigFile: nodePath.join(cwd(), project != null ? project : "tsconfig.json")
    })
  );
  const {
    rollup,
    //
    externals,
    input
  } = config;
  const externalsFn = externalsGenerator(externals, pkgJson);
  if (config.bundle) {
    const rollupOptionsArr = config.bundle.map((bundle2) => {
      const _a = bundle2, { input: input_ } = _a, otherProps = __objRest(_a, ["input"]);
      return __spreadValues({
        input: input_ || input,
        output: [otherProps],
        plugins: rollupPlugins,
        external: externalsFn
      }, rollup);
    });
    if (config.dtsRollup) {
      if (config.dtsRollup && !pkgJson.types) {
        throw new Error(
          "'dtsRollup' is enabled, Looks like you forget to add types field in local package.json file"
        );
      }
      rollupOptionsArr.push(__spreadValues({
        input: "src/index",
        output: { file: pkgJson.types, format: "esm" },
        external: externalsFn,
        plugins: [
          dts({
            tsConfigFile: "tsconfig.json",
            dtsFileName: pkgJson.types
          }),
          ...rollupPlugins
        ]
      }, rollup));
    }
    const bundleTasks = await bundle(rollupOptionsArr);
    await Promise.all(bundleTasks.map((task) => task()));
  }
};
cli(process.argv.slice(1)).then(() => {
  console.log("finished");
}).catch((e) => {
  console.error(e);
});
