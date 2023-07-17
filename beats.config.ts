import { type Config } from ".";

export default {
    rollup: { treeshake: "recommended" },
    eslint: { fix: true },
    bundleOverwrite(c) {
        console.log(c);
        return c;
    },
} as Config;
