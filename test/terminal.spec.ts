import { describe, it, expect } from "vitest";
import Termianl from "../src/terminal";

const t = new Termianl();

describe("Test write", () => {
    it("should log to terminal", function () {
        expect(() => {
            console.log(`asdasd`);
            t.clearLine();
        }).not.throw();
    });
});
