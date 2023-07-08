/**
 * @TBD
 */
import { type Plugin } from "rollup";

export default function cleanup(): Plugin {
    return {
        name: "rmdir",
        version: "0.0.1",
        buildEnd: {
            order: "pre",
            sequential: true,
            async handler() {
                //
            },
        },
    };
}
