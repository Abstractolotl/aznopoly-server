export class Packet {
    private readonly type: string;
    private readonly data: unknown;

    constructor(type: string, data: unknown) {
        this.type = type;
        this.data = data;
    }

    getType() : string {
        return this.type
    }

    getData() : unknown {
        return this.data
    }

    toString() : string {
        return JSON.stringify({
            'type': this.type,
            'data': this.data
        })
    }
}

export class ServerPacket extends Packet {
    constructor(type: string, data: unknown) {
        super("ROOM_" + type, data);
    }

}

export class ClientPacket extends Packet {

    private readonly sender: string;

    constructor(sender: string, type: string, data: unknown) {
        super(type, data);
        this.sender = sender;
    }
}

export class WelcomePacket extends Packet {

    constructor(uuid: string, room: object) {
        super("ROOM_WELCOME", {
            'uuid': uuid,
            'room': room
        })
    }

}

export class JoinPacket extends Packet {
    constructor(uuid: string) {
        super("ROOM_JOIN", {
            'uuid': uuid
        });
    }
}

export class QuitPacket extends Packet {
    constructor(uuid: string) {
        super("ROOM_QUIT", {
            'uuid': uuid
        });
    }
}