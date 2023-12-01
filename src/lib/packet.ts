export class SimplePacket {

    private readonly type: string;
    private readonly data: unknown;

    constructor(type: string, data: unknown) {
        this.type = type;
        this.data = data;
    }

    toString() : string {
        return JSON.stringify({
            'type': this.type,
            'data': this.data
        })
    }

}