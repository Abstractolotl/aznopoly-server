export class Logger {

    private readonly debugState: boolean;

    constructor(debug: boolean = false) {
        this.debugState = debug
    }

    private date() : string {
        return new Date().toISOString()
    }

    public info(log: string) {
        console.log(`[${this.date()}|INFO] ${log}`)
    }

    public warning(log: string) {
        console.log(`[${this.date()}|WARNING] ${log}`)
    }

    public error(log: string) {
        console.log(`[${this.date()}|ERROR] ${log}`)
    }

    public debug(log: string) {
        if(this.debugState)
            console.log(`[${this.date()}|DEBUG] ${log}`)
    }

}