import Terminal from "@/terminal";
import { colors } from "@nfts/nodeutils";

class Log {
    public readonly term: Terminal;

    constructor({ term }: { term: Terminal }) {
        this.term = term;
    }

    info(text: string) {
        if (process.env.DEBUG) {
            this.term.writeLine(
                `${colors.magenta(colors.bold("INFO"))} ▶︎ ${text}`,
            );
            term.nextLine();
        }
    }

    debug(text: string) {
        if (process.env.DEBUG) {
            this.term.writeLine(
                `${colors.magenta(colors.bold("DEBUG"))} ▶︎ ${text}`,
            );
            term.nextLine();
        }
    }

    verbose(text: string) {
        if (process.env.VERBOSE) {
            this.term.writeLine(
                `${colors.magenta(colors.bold("VERBOSE"))} ▶︎ ${text}`,
            );
            term.nextLine();
        }
    }

    error(text: string) {
        this.term.writeLine(`${colors.red(colors.bold("ERROR"))}`);
        term.nextLine();
        this.term.writeLine(`${text}`);
        term.nextLine();
    }

    warn(text: string) {
        this.term.writeLine(`${colors.yellow(colors.bold("WARN"))} ▶︎ ${text}`);
        term.nextLine();
    }
}

const term = new Terminal();

export default new Log({ term });

