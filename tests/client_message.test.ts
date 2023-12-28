import {afterAll, beforeAll, beforeEach, describe, expect, test} from "bun:test";
import {Logger} from "@/lib/logger.ts";
import RoomManager from "@/lib/room_manager.ts";
import startServer from "@/lib/server.ts";
import {Server} from "bun";
import {ClientPacket, Packet, ServerPacket, WelcomePacket} from "@/lib/packet.ts";

describe('client_message', () => {

    let server: Server;

    beforeAll(() => {
        const logger = new Logger();
        const roomManager = new RoomManager(4);
        server = startServer(logger, roomManager, 3000)
    })

    afterAll(() => {
        server.stop(true);
    })

    test('Server blocks sending server packets', async () => {
        const clientOne: WebSocket = new WebSocket("ws://localhost:3000/server/room/abc-123")

        let lastPacket = new Packet('SUCCESS', 'none')
        clientOne.addEventListener("message", function (event) {
            lastPacket = JSON.parse(<string>event.data) as Packet;
            if(lastPacket.type !== 'ROOM_WELCOME' && lastPacket.type !== "ROOM_JOIN") {
                clientOne.close()
            }
        })

        let error: number = 0;
        clientOne.addEventListener("error", event => {
            error += 1;
        })

        await waitForSocketState(clientOne, WebSocket.OPEN)
        clientOne.send(JSON.stringify(new ServerPacket("TEST", "Cool data")))
        await waitForSocketState(clientOne, WebSocket.CLOSED);

        expect(lastPacket.type).toBe("ERROR")
        // @ts-ignore
        expect(lastPacket.data?.message).toBe("Invalid packet type: ROOM_TEST")
    })

    test('Server blocks sending arbitrary packets', async () => {
        const clientOne: WebSocket = new WebSocket("ws://localhost:3000/server/room/abc-123")

        let lastPacket = new Packet('SUCCESS', 'none')
        clientOne.addEventListener("message", function (event) {
            lastPacket = JSON.parse(<string>event.data) as Packet;
            if(lastPacket.type !== 'ROOM_WELCOME' && lastPacket.type !== "ROOM_JOIN") {
                clientOne.close()
            }
        })

        let error: number = 0;
        clientOne.addEventListener("error", event => {
            error += 1;
        })

        await waitForSocketState(clientOne, WebSocket.OPEN)
        clientOne.send(JSON.stringify(new Packet("HACKING_PACKET", "Cool data")))
        await waitForSocketState(clientOne, WebSocket.CLOSED);

        expect(lastPacket.type).toBe("ERROR")
        // @ts-ignore
        expect(lastPacket.data?.message).toBe("Invalid packet type: HACKING_PACKET")
    })

    test('Server broadcasts valid packet with sender attached', async () => {
        const clientOne: WebSocket = new WebSocket("ws://localhost:3000/server/room/abc-123")
        const clientTwo: WebSocket = new WebSocket("ws://localhost:3000/server/room/abc-123")

        let uuid: string = "none"
        clientOne.addEventListener("message", function (event) {
            let packet = JSON.parse(<string>event.data) as Packet;
            if (packet.type === 'ROOM_WELCOME') {
                let welcome = packet as WelcomePacket;
                // @ts-ignore
                uuid = welcome.data?.uuid
            }
        })

        let lastPacket= new Packet('ERROR', 'none')
        clientTwo.addEventListener("message", function (event) {
            lastPacket = JSON.parse(<string>event.data) as Packet
            if(lastPacket.type !== 'ROOM_WELCOME' && lastPacket.type !== "ROOM_JOIN") {
                clientTwo.close()
            }
        })

        await waitForSocketState(clientOne, WebSocket.OPEN)
        await waitForSocketState(clientTwo, WebSocket.OPEN)

        clientOne.send(JSON.stringify(new Packet("CLIENT_MOVE", {"field": 1})))
        clientOne.close()

        await waitForSocketState(clientOne, WebSocket.CLOSED)
        await waitForSocketState(clientTwo, WebSocket.CLOSED)

        expect(lastPacket.type).toBe("CLIENT_MOVE")

        let clientPacket = lastPacket as ClientPacket
        expect(clientPacket.sender).toBe(uuid)
    })
})

function waitForSocketState(socket: WebSocket, state: WebSocketReadyState) {
    return new Promise<void>(function (resolve) {
        setTimeout(function () {
            if (socket.readyState === state) {
                resolve();
            } else {
                waitForSocketState(socket, state).then(resolve);
            }
        }, 5);
    });
}