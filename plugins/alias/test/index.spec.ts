import { test, expect } from "vitest";
import { aliasToModulePath } from "../src";

const paths = {
    "@/*": ["./src/*"],
    "utils/*": ["./src/utils/*"],
    jquery: ["./lib/jquery"],
    "externals:*": ["./lib/*"],
};

const resolve = aliasToModulePath(paths);

test("resolve", () => {
    expect(resolve("@/log")).toBe("./src/log");
    expect(resolve("@/utils")).toBe("./src/utils");
    expect(resolve("@/services")).toBe("./src/services");
    expect(resolve("utils/debug")).toBe("./src/utils/debug");
    expect(resolve("jquery")).toBe("./lib/jquery");
    expect(resolve("externals:stream")).toBe("./lib/stream");
});
