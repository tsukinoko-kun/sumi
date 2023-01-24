export class Logger {
    private readonly logs: Array<string>;

    constructor() {
        this.logs = new Array<string>();
    }

    log(...message: Array<string | number | boolean>) {
        this.logs.push(message.join(" "));
    }

    warn(...message: Array<string | number | boolean>) {
        this.logs.push(`WARNING: ${message.join(" ")}`);
    }

    error(...message: Array<string | number | boolean>) {
        this.logs.push(`ERROR: ${message.join(" ")}`);
    }

    toString() {
        return this.logs.join("\n");
    }
}
