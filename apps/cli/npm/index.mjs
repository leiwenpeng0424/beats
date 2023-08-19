import { module_, file, colors, ms, json, parser } from '@nfts/nodeutils';
import nodeFs from 'node:fs/promises';
import nodePath from 'node:path';
import cleanup from '@nfts/plugin-cleanup';
import esbuild from '@nfts/plugin-esbuild';
import bundleProgress from '@nfts/plugin-progress';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import nodeResolve from '@rollup/plugin-node-resolve';
import Module from 'node:module';
import { rollup, watch } from 'rollup';
import { ExtractorConfig, Extractor } from '@microsoft/api-extractor';
import ts, { sys, createCompilerHost, createProgram, readJsonConfigFile, parseJsonSourceFileConfigFileContent } from 'typescript';
import alias from '@nfts/plugin-alias';
import styles from '@nfts/plugin-styles';
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
    for await (const configFile of Configs) {
      try {
        const configFilePath = nodePath.join(_cwd, configFile);
        await nodeFs.access(configFilePath);
        configPath = configFilePath;
        break;
      } catch (e) {
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
  return result ?? [];
}
function stripAnsi(text, { onlyFirst } = { onlyFirst: true }) {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
  ].join("|");
  const regexp = new RegExp(pattern, onlyFirst ? void 0 : "g");
  return text.replace(regexp, "");
}

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
      options: {
        ...config.options,
        noEmit: false
      },
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
    colors.bold(nodePath.relative(process.cwd(), input))
  )} ${colors.bold("->")} ${nodePath.relative(process.cwd(), trimmedFile)}`;
  term.writeLine(message);
  term.nextLine();
  term.nextLine();
}

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
    return externals?.includes(id) || nativeModules.includes(id);
  };
};
const applyPlugins = (options) => {
  return [
    cleanup(options?.clean),
    styles(options?.styles),
    alias(options?.alias ?? { alias: {} }),
    // @TODO
    // postcssPlugin({ cssModules: true }),
    esbuild(
      Object.assign({
        options: options?.esbuild,
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
        options?.nodeResolve ?? {}
      )
    ),
    commonjs(
      Object.assign({ extensions: Extensions }, options?.commonjs ?? {})
    ),
    eslint(Object.assign({}, options?.eslint ?? {})),
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
  for await (const option of options) {
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
          return {
            ...output2,
            duration
          };
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
            start?.();
            if (firstRun) {
              term.writeLine(`Start rollup watching bundle.`);
            }
            startTime = (/* @__PURE__ */ new Date()).getTime();
            break;
          }
          case "BUNDLE_START": {
            bundleStart?.();
            break;
          }
          case "BUNDLE_END": {
            bundleEnd?.();
            break;
          }
          case "END": {
            end?.().finally(() => {
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
            error?.();
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
  const { input } = rollup2;
  const { module, main, types } = pkgJson;
  const output = module || main;
  const inputBasename = nodePath.basename(input);
  const outputBasepath = output ? nodePath.dirname(output) : outputDir;
  const ext = nodePath.extname(inputBasename);
  const outputBasename = ext ? inputBasename.replace(ext, ".d.ts") : `${inputBasename ?? "index"}.d.ts`;
  if (config.dtsRollup) {
    await dtsGen({
      term,
      input,
      tsConfigFile: config.project ?? tsconfig,
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
  const paths = tsConfig.compilerOptions?.paths ?? {};
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
    esbuild: Object.assign({ minify }, esbuild2 ?? {}),
    styles: styles2,
    alias: { alias: paths },
    clean: { active: !watch2 }
  });
  const externalsFn = externalsGenerator(externals, pkgJson);
  let bundles = [];
  const { plugins: extraPlugins = [], ...rollupOpts } = rollupOpt;
  const rollupOptionWithoutInputOutput = {
    perf: true,
    treeshake: true,
    strictDeprecations: true,
    plugins: [...rollupPlugins, extraPlugins],
    external: externalsFn,
    ...rollupOpts ?? {}
  };
  if (config.bundle) {
    bundles = config.bundle.reduce((options, bundle2) => {
      const { input: bundleInput, ...otherProps } = bundle2;
      const option = {
        input: bundleInput || (cliInput ? normalizeCliInput(cliInput) : input),
        output: [{ ...otherProps, sourcemap }],
        ...rollupOptionWithoutInputOutput
      };
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
            { ...otherProps, sourcemap }
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

class Terminal {
  stdin = process.stdin;
  stdout = process.stdout;
  x;
  y;
  maxCols;
  rl;
  constructor() {
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
      cb?.();
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
  return {
    ...raw,
    compilerOptions: options
  };
}

async function cli(args) {
  const [, ..._args] = args;
  const pkgJson = json.readJSONSync(packageJson);
  const beatsPkgJson = json.readJSONSync(
    nodePath.resolve(require.resolve(".."), "../../package.json")
  );
  const term = new Terminal();
  const {
    project,
    config: configPath,
    debug = false,
    verbose = false,
    ...restInputOptions
  } = parser(_args);
  loadEnv({ DEBUG: String(debug), VERBOSE: String(verbose) });
  if (!restInputOptions.watch) {
    term.clearScreen().box([
      colors.red(`@nfts/beats(${beatsPkgJson.version})`)
    ]);
    term.nextLine();
  }
  const tsConfig = loadTsConfigJson(project ?? tsconfig);
  const config = await tryReadConfig({
    configPath,
    pkgJson
  });
  return startRollupBundle({
    term,
    config: {
      ...config,
      ...restInputOptions,
      project
    },
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
