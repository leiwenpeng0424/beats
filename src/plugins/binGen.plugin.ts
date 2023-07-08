import { type Plugin } from "rollup";
import type { IPackageJson } from "@nfts/pkg-json";

export type RollupBinGenOptions = {
    bin: IPackageJson["bin"];
};

export default function binGen({ bin }: RollupBinGenOptions): Plugin {
    return {
        name: "bin-gen",
        buildStart() {
            //
        },
        generateBundle() {
            //
        },
        resolveId() {
            //
        },
    };
}
