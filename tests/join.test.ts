import {afterAll, beforeAll, beforeEach, describe, expect, test} from "bun:test";
import {Logger} from "@/lib/logger.ts";
import RoomManager from "@/lib/room_manager.ts";
import startServer from "@/lib/server.ts";
import {Server} from "bun";
import {Packet} from "@/lib/packet.ts";

describe('join', () => {

    let server: Server;

    beforeAll(() => {
        const logger = new Logger();
        const roomManager = new RoomManager(4);
        server = startServer(logger, roomManager, 3000)
    })

    afterAll(() => {
        server.stop(true);
    })

    test('Server allows connection to room', async () => {
        const clientOne: WebSocket = new WebSocket("ws://localhost:3000/server/room/abc-123")

        let lastPacket = new Packet('ERROR', 'none')
        clientOne.addEventListener("message", function (event) {
            lastPacket = JSON.parse(<string>event.data) as Packet;
            clientOne.terminate()
        })

        let error: number = 0;
        clientOne.addEventListener("error", event => {
            error += 1;
        })

        await waitForSocketState(clientOne, WebSocket.CLOSED);

        expect(lastPacket.type).toBe("ROOM_WELCOME");
        expect(error).toBe(0);
    })

    test('Join packet is broadcasted', async () => {
        const clientOne: WebSocket = new WebSocket("ws://localhost:3000/server/room/abc-123")

        let lastPacket= new Packet('ERROR', 'none')
        clientOne.addEventListener("message", function (event) {
            lastPacket = JSON.parse(<string>event.data) as Packet;
        })

        const clientTwo: WebSocket = new WebSocket("ws://localhost:3000/server/room/abc-123")
        await waitForSocketState(clientTwo, WebSocket.OPEN)

        clientOne.close()
        clientTwo.close()

        await waitForSocketState(clientOne, WebSocket.CLOSED);
        await waitForSocketState(clientTwo, WebSocket.CLOSED);

        expect(lastPacket.type).toBe("ROOM_JOIN")
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