import RoomManager from "@/lib/room_manager.ts";
import {ClientData} from "@/types.ts";
import {Server, ServerWebSocket} from "bun";
import {handleHealthEndpoints} from "@/routes/health.ts";
import {ClientPacket, JoinPacket, Packet, QuitPacket, ServerPacket, WelcomePacket} from "@/lib/packet.ts";
import {Logger} from "@/lib/logger.ts";

export default function startServer(logger: Logger, roomManager: RoomManager, port: number = 3000) : Server {
    const server = Bun.serve<ClientData>({
        port: port,
        development: false,
        fetch(request: Request, server: Server): undefined | Response {
            const url = new URL(request.url)
            let routes = url.pathname.split("/")
            // Rooms will be available via /room/<room-uuid>
            if (routes[1].toLowerCase() === 'server') {

                if (routes.length < 3) {
                    return new Response(JSON.stringify({message: 'Page not found'}), {status: 404});
                }

                if (routes[2].toLowerCase() === 'room') {
                    if (routes.length < 4) {
                        return new Response(JSON.stringify({message: "No roomId provided"}), {status: 400})
                    }

                    let roomId = routes[3].toLowerCase();
                    if (!roomId.match(/[a-z\d-]{6,}/)) {
                        return new Response(JSON.stringify({message: "Invalid roomId provided"}), {status: 400})
                    }

                    const success = server.upgrade(request, {
                        data: {
                            roomId: roomId,
                            uuid: crypto.randomUUID()
                        }
                    });
                    return success ? undefined : new Response(JSON.stringify({message: "WebSocket upgrade error"}), {status: 400});
                }
            } else if(routes[1].toLowerCase() === 'health') {
                return handleHealthEndpoints(routes)
            }
            return new Response(JSON.stringify({message: 'Page not found'}), {status: 404});
        },
        websocket: {
            open(webSocket: ServerWebSocket<ClientData>): void | Promise<void> {
                if (roomManager.joinRoom(webSocket.data.roomId, webSocket.data.uuid)) {
                    logger.info(`${webSocket.data.uuid} connected to room ${webSocket.data.roomId}`)

                    server.publish(webSocket.data.roomId, JSON.stringify(new JoinPacket(webSocket.data.uuid)))
                    webSocket.subscribe(webSocket.data.roomId)
                    webSocket.sendText(JSON.stringify(new WelcomePacket(webSocket.data.uuid, roomManager.getRoom(webSocket.data.roomId))), true)
                } else {
                    webSocket.close(1011, JSON.stringify(new ServerPacket("LIMIT", webSocket.data.roomId)))
                }
            },
            message: function (webSocket: ServerWebSocket<ClientData>, message: string): void | Promise<void> {
                let packet = JSON.parse(message) as Packet;
                if(packet !== undefined && packet.type.startsWith("CLIENT_")) {
                    let clientPacket = new ClientPacket(webSocket.data.uuid, packet.type, packet.data);
                    webSocket.publish(webSocket.data.roomId, JSON.stringify(clientPacket))
                } else {
                    webSocket.send(JSON.stringify(new ServerPacket("ERROR", {'message': `Invalid packet type: ${packet.type}`})))
                }
            },
            close(webSocket: ServerWebSocket<ClientData>, code: number, reason: string): void | Promise<void> {
                roomManager.leaveRoom(webSocket.data.roomId, webSocket.data.uuid)
                logger.info(`${webSocket.data.uuid} disconnected from room ${webSocket.data.roomId}`)

                webSocket.unsubscribe(webSocket.data.roomId)
                server.publish(webSocket.data.roomId, JSON.stringify(new QuitPacket(webSocket.data.uuid)))
            }
        }
    });
    return server;
}