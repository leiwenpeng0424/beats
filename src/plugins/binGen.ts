import { type Plugin } from "rollup";
import type { IPackageJson } from "@nfts/pkg-json";

export type RollupBinGenOptions = {
    bin: IPackageJson["bin"];
};

export default function binGen({}: RollupBinGenOptions): Plugin {
    return {
        name: "bin-gen",
        options() {
            // console.log("input", input);
        },
        outputOptions() {
            // console.log("output", output);
        },
    };
}
