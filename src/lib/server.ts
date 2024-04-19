import RoomManager from "@/lib/room_manager.ts";
import {ClientData} from "@/types.ts";
import {Server, ServerWebSocket} from "bun";
import {handleHealthEndpoints} from "@/routes/health.ts";
import {ClientPacket, JoinPacket, Packet, QuitPacket, ServerPacket, WelcomePacket} from "@/lib/packet.ts";
import {Logger} from "@/lib/logger.ts";
import {handleDiscordAuthentication} from "@/routes/discord.ts";

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
}

export default function startServer(logger: Logger, roomManager: RoomManager, port: number = 3000) : Server {
    const server = Bun.serve<ClientData>({
        port: port,
        development: false,
        fetch(request: Request, server: Server): Promise<Response> | Response | undefined {
            const { method } = request;
            const { pathname } = new URL(request.url);
            const roomRegex = /^\/server\/room\/([a-z\d-]{6,})$/;

            if (method === 'GET' && pathname === '/health') {
                return handleHealthEndpoints(pathname.split('/'))
            }

            if (method === 'GET') {
                const match = pathname.match(roomRegex);
                const id = match && match[1];

                if (id) {
                    const success = server.upgrade(request, {
                        data: {
                            roomId: id,
                            uuid: crypto.randomUUID()
                        }
                    });
                    return success ? undefined : new Response(JSON.stringify({message: "WebSocket upgrade error"}), {headers: HEADERS, status: 400});
                }
            }

            if (method === 'POST' && pathname === '/server/token') {
                if (request.headers.get('content-type') !== 'application/json') {
                    return new Response(JSON.stringify({message: 'Invalid content-type'}), {headers: HEADERS, status: 400});
                }
                return handleDiscordAuthentication(request);
            }

            if (method === 'OPTIONS' ) {
                return new Response(null, {headers: HEADERS, status: 200});
            }

            return new Response(JSON.stringify({message: 'Page not found'}), {headers: HEADERS, status: 404});
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
                    webSocket.send(JSON.stringify(new Packet("ERROR", {'message': `Invalid packet type: ${packet.type}`})))
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