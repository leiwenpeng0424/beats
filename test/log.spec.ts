import { describe, it, expect } from "vitest";
import { debugLog, verboseLog } from "../src/log";

describe("Should log properly", () => {
    it("should log to terminal", function () {
        expect(() => {
            debugLog("info");
        }).not.throw();
    });

    it("should verbose log to terminal", function () {
        expect(() => {
            verboseLog("verbose");
        }).not.throw();
    });
});
