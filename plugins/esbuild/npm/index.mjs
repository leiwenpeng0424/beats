import { transform } from 'esbuild';
import { extname } from 'node:path';
import { formatDiagnosticsWithColorAndContext, sys, getParsedCommandLineOfConfigFile, createCompilerHost, createProgram, getConfigFileParsingDiagnostics, readJsonConfigFile, parseJsonSourceFileConfigFileContent } from 'typescript';

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
function createCompilerProgram(compilerOptions, tsconfig) {
  const config = getParsedCommandLineOfConfigFile(tsconfig, compilerOptions, {
    useCaseSensitiveFileNames: true,
    getCurrentDirectory: sys.getCurrentDirectory,
    readDirectory: sys.readDirectory,
    fileExists: sys.fileExists,
    readFile: sys.readFile,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      console.log(
        `onUnRecoverableConfigFileDiagnostic`,
        diagnostic.messageText
      );
    }
  });
  const host = createCompilerHost(compilerOptions);
  if (config) {
    return createProgram({
      host,
      options: __spreadProps(__spreadValues({}, config.options), {
        noEmit: false
      }),
      rootNames: config.fileNames,
      projectReferences: config.projectReferences,
      configFileParsingDiagnostics: getConfigFileParsingDiagnostics(config)
    });
  }
}
function loadTsConfigJson(path) {
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
  return __spreadProps(__spreadValues({}, raw), {
    compilerOptions: options
  });
}
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
      const result = await transform(code, __spreadValues({
        loader,
        target: "es5",
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

export { esbuild as default };
