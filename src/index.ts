import "./cli";
import type { Config } from "./configuration";

import alias from "@/plugins/alias";

export * from "./configuration";

export { alias };

export function defineConfig(options: Config) {
    return options;
}
