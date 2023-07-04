import { colors } from "@nfts/utils";
import { type OutputChunk, type Plugin } from "rollup";

export default function bundleProgress(): Plugin {
    return {
        name: "bin",
        async writeBundle(output, bundle) {
            const files = Object.keys(bundle);
            for (const file of files) {
                const { facadeModuleId } = bundle[file] as OutputChunk;
                facadeModuleId &&
                    console.log(
                        colors.bgGreen(
                            colors.bold(colors.black(facadeModuleId)),
                        ),
                        "➡︎",
                        colors.cyan(file),
                    );
            }
        },
    };
}
