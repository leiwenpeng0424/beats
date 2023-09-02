import { describe, test, expect } from "vitest";
import { resolveDtsEntryFromEntry } from "../src/utils";
import nodePath from "node:path";

describe("utils test cases", () => {
    test("resolveDtsEntryFromEntry test case", () => {
        const outDir1 = ".dts";
        const outDir2 = ".temp/dts";

        const entry1 = "src/index.ts";
        const entry2 = "src/entry/index.ts";
        const entry3 = "src/index";
        const entry4 = "src/entry/index";

        expect(resolveDtsEntryFromEntry(outDir1, entry1)).toBe(
            nodePath.resolve(process.cwd(), `${outDir1}/index.d.ts`),
        );

        expect(resolveDtsEntryFromEntry(outDir1, entry2)).toBe(
            nodePath.resolve(process.cwd(), `${outDir1}/entry/index.d.ts`),
        );

        expect(resolveDtsEntryFromEntry(outDir1, entry3)).toBe(
            nodePath.resolve(process.cwd(), `${outDir1}/index.d.ts`),
        );

        expect(resolveDtsEntryFromEntry(outDir1, entry4)).toBe(
            nodePath.resolve(process.cwd(), `${outDir1}/entry/index.d.ts`),
        );

        expect(resolveDtsEntryFromEntry(outDir2, entry1)).toBe(
            nodePath.resolve(process.cwd(), `${outDir2}/index.d.ts`),
        );

        expect(resolveDtsEntryFromEntry(outDir2, entry2)).toBe(
            nodePath.resolve(process.cwd(), `${outDir2}/entry/index.d.ts`),
        );

        expect(resolveDtsEntryFromEntry(outDir2, entry3)).toBe(
            nodePath.resolve(process.cwd(), `${outDir2}/index.d.ts`),
        );

        expect(resolveDtsEntryFromEntry(outDir2, entry4)).toBe(
            nodePath.resolve(process.cwd(), `${outDir2}/entry/index.d.ts`),
        );
    });
});
