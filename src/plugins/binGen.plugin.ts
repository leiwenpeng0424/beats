import { type Plugin } from "rollup";
import type { IPackageJson } from "@nfts/pkg-json";

export type RollupBinGenOptions = {
    bin: IPackageJson["bin"];
};

export default function binGen({ bin }: RollupBinGenOptions): Plugin {
    console.log("bin ->", bin);
    return {
        name: "bin-gen",
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
