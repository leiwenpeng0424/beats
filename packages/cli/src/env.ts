import dotenv, { type DotenvPopulateInput } from "dotenv";
import dotenvExpand from "dotenv-expand";

export default function loadEnv(input: DotenvPopulateInput) {
    const config = dotenv.config({
        processEnv: input,
    });
    dotenvExpand.expand(config);
}
