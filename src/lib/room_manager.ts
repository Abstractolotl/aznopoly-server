export default class RoomManager {

    private readonly maxClients: number;
    private rooms: Map<string, Room> = new Map;

    constructor(maxClients: number) {
        this.maxClients = maxClients;
    }

    joinRoom(room: string, client: string) : boolean {
        if ( ! this.rooms.has(room) ) {
           this.rooms.set(room, new Room(client))
        } else {
            if(this.rooms.get(room)!.getClients() >= this.maxClients){
                return false
            }
            this.rooms.get(room)?.join(client)
        }
        return true
    }

    leaveRoom(room: string, client: string) {
        if( this.rooms.has(room) ) {
            this.rooms.get(room)?.leave(client)
            if(this.rooms.get(room)!.getClients() <= 0) {
                this.rooms.delete(room)
            }
        }
    }

    getRoom(room: string) : object {
        if( this.rooms.has(room) ) {
            let roomData = this.rooms.get(room);
            return {
                'host': roomData?.getHost(),
                'clients': roomData?.getClientList()
            };
        }
        return {}
    }
}

class Room {

    private clients: string[] = [];
    private host: string;

    constructor(host: string) {
        this.host = host
        this.clients.push(host)
    }

    getHost() : string {
        return this.host
    }

    getClientList() : string[] {
        return this.clients
    }

    getClients() : number {
        return this.clients.length
    }

    join(client: string) {
        if(!this.clients.includes(client))
            this.clients.push(client)
    }

    leave(client: string) {
        if(this.clients.includes(client))
            this.clients = this.clients.filter(c => c !== client)
        if(client === this.host && this.getClients() > 0) {
            this.host = this.clients[0];
        }
    }

}