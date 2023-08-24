import { test, expect } from "vitest";
import { aliasToModulePath, validTsConfigPath } from "../src";

const paths = {
    "@/*": ["./src/*"],
    "utils/*": ["./src/utils/*"],
    jquery: ["./lib/jquery"],
};

const resolve = aliasToModulePath(paths);

test("validTsConfigPath", () => {
    expect(validTsConfigPath("@/*")).toBe(true);
    expect(validTsConfigPath("src/*")).toBe(true);
    expect(validTsConfigPath("utils/*")).toBe(true);
    expect(validTsConfigPath("services/*")).toBe(true);
    expect(validTsConfigPath("services/client/*")).toBe(true);
    expect(validTsConfigPath("services")).toBe(false);
    expect(validTsConfigPath("./services")).toBe(false);
});

test("resolve", () => {
    expect(resolve("@/log")).toBe("./src/log");
    expect(resolve("@/utils")).toBe("./src/utils");
    expect(resolve("@/services")).toBe("./src/services");
    expect(resolve("utils/debug")).toBe("./src/utils/debug");
    expect(resolve("jquery")).toBe("./lib/jquery");
});

