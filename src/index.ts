import "@/cli";
import type { Config } from "@/configuration";

export * from "@/configuration";

export function defineConfig(options: Config) {
    return options;
}
