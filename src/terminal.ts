import readline from "node:readline";
import { strSplitByLength, stripAnsi } from "@/utils";

export default class Terminal {
    private readonly stdin = process.stdin;
    private readonly stdout = process.stdout;

    private x: number;
    private y: number;

    private maxCols: number;

    private readonly rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: this.stdin,
            output: this.stdout,
            historySize: 0,
            removeHistoryDuplicates: true,
            tabSize: 4,
            prompt: "",
            terminal: process.stdout.isTTY,
        });

        const pos = this.rl.getCursorPos();
        this.x = pos.cols;
        this.y = pos.rows;
        this.maxCols = process.stdout.columns;
    }

    private _write(content: string) {
        readline.clearScreenDown(this.stdin);
        const segments = strSplitByLength(content, this.maxCols);
        segments.forEach((text) => {
            this.rl.write(text);
            this.y += 1;
        });

        return this;
    }

    public nextLine() {
        this.y += 1;
        this.rl.write("\r");
        return this;
    }

    public clearLine(cb?: () => void) {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1, () => {
            cb?.();
        });
        // readline.cursorTo(this.stdout, 0, this.y);
        // readline.clearLine(this.stdout, 0);
        return this;
    }

    public writeSameLine(content: string) {
        this.clearLine(() => {
            this._write(content);
        });
        return this;
    }

    public writeLine(
        content: string,
        options: { endWithNewLine: boolean } = {
            endWithNewLine: false,
        },
    ) {
        this._write(content);
        if (options.endWithNewLine) {
            this.nextLine();
        }
        return this;
    }

    public clearScreen() {
        this.x = 0;
        this.y = 0;
        readline.cursorTo(this.stdin, this.x, this.y);
        readline.clearScreenDown(this.stdin);
        return this;
    }

    public box(content: string | string[]) {
        this.nextLine();
        this.writeLine(
            `╭${Array(this.maxCols - 2)
                .fill("─")
                .join("")}╮`,
        );
        const padding = 4;
        const writeCenter = (text: string) => {
            const originLen = text.length;
            const stripLen = stripAnsi(text).length;

            const len = stripAnsi(text).length - (originLen - stripLen) - 0;
            const restLen = this.maxCols - padding * 2;

            if (restLen < len) {
                strSplitByLength(text, restLen).forEach((t) => {
                    writeCenter(t);
                });
            } else {
                const left = Math.ceil((restLen - len) / 2);
                const leftPadding =
                    "│" +
                    Array(left + padding - 1)
                        .fill(" ")
                        .join("");
                const rightPadding =
                    Array(restLen - left - len + padding - 1)
                        .fill(" ")
                        .join("") + "│";

                this.writeLine(`${leftPadding}${text}${rightPadding}`);
            }
        };
        const contents = [
            " ",
            typeof content === "string" ? content : content,
            " ",
        ].flat();
        contents.forEach((t) => {
            writeCenter(t);
        });
        this.writeLine(
            `╰${Array(this.maxCols - 2)
                .fill("─")
                .join("")}╯`,
        );
        this.nextLine();
        return this;
    }
}
