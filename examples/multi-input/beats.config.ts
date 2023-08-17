import { defineConfig } from "@nfts/beats";

export default defineConfig({
    dtsRollup: true,
    bundle: [
        {
            input: "src/cli.ts",
            format: "cjs",
            file: "bin/cli.js",
        },
        {
            input: "src/otherCli.ts",
            format: "commonjs",
            file: "bin/otherCli.js",
        },
    ],
    esbuild: {
        minify: true,
    },
});
