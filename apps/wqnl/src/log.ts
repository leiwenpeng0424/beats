import { colors, Terminal } from "@nfts/nodeutils";

class Log {
    public readonly term: Terminal;

    constructor({ term }: { term: Terminal }) {
        this.term = term;
    }

    public info(text: string) {
        this.term.writeLine(
            `${colors.magenta(colors.bold("INFO"))} ▶︎ ${text}`,
        );
        term.nextLine();
    }

    public debug(text: string) {
        if (process.env.DEBUG) {
            this.term.writeLine(
                `${colors.magenta(colors.bold("DEBUG"))} ▶︎ ${text}`,
            );
            term.nextLine();
        }
    }

    public verbose(text: string) {
        if (process.env.VERBOSE) {
            this.term.writeLine(
                `${colors.magenta(colors.bold("VERBOSE"))} ▶︎ ${text}`,
            );
            term.nextLine();
        }
    }

    public warn(text: string) {
        this.term.writeLine(`${colors.yellow(colors.bold("WARN"))} ▶︎ ${text}`);
        term.nextLine();
    }

    public error(text: string) {
        this.term.writeLine(
            `${colors.red(colors.bold("ERROR"))} ▶︎ ${colors.bgRed(
                colors.black(` ${text} `),
            )}`,
        );
        term.nextLine();
        term.nextLine();
    }
}

const term = new Terminal();

export default new Log({ term });
