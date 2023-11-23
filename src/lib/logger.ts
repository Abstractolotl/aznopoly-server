import {format} from "util";

export class Logger {

    private readonly debugState: boolean;

    constructor(debug: boolean = false) {
        this.debugState = debug
    }

    private logFormat() : string {
        return "[%s|%s] %s"
    }

    private date() : string {
        return new Date().toISOString()
    }

    public info(log: string) {
        console.log(format(this.logFormat(), this.date(), "INFO", log))
    }

    public warning(log: string) {
        console.log(format(this.logFormat(), this.date(), "WARNING", log))
    }

    public error(log: string) {
        console.log(format(this.logFormat(), this.date(), "ERROR", log))
    }

    public debug(log: string) {
        if(this.debugState)
            console.log(format(this.logFormat(), this.date(), "DEBUG", log))
    }

}