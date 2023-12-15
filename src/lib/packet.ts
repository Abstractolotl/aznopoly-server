export class ServerPacket {

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

export class WelcomePacket extends ServerPacket {

    constructor(uuid: string, room: object) {
        super("ROOM_WELCOME", {
            'uuid': uuid,
            'room': room
        })
    }

}

export class JoinPacket extends ServerPacket {
    constructor(uuid: string) {
        super("ROOM_JOIN", {
            'uuid': uuid
        });
    }
}

export class QuitPacket extends ServerPacket {
    constructor(uuid: string) {
        super("ROOM_QUIT", {
            'uuid': uuid
        });
    }
}