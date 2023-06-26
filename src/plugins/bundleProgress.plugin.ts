import { type Plugin } from "rollup";

export default function bundleProgress(): Plugin {
    return {
        name: "bin",
        async buildStart() {
            //
        },
        async generateBundle() {
            //
        },
        async resolveId() {
            //
        },
    };
}
