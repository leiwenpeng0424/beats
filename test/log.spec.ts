import { describe, it, expect } from "vitest";
import { info, verboseLog } from "../src/log";

describe("Should log properly", () => {
    it("should log to terminal", function () {
        expect(() => {
            info("info");
        }).not.throw();
    });

    it("should verbose log to terminal", function () {
        expect(() => {
            verboseLog("verbose");
        }).not.throw();
    });
});
