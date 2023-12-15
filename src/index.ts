import {Server, ServerWebSocket} from "bun";
import {ClientData} from "@/types.ts";
import {handleHealthEndpoints} from "@/routes/health.ts";
import {Logger} from "@/lib/logger.ts";
import {JoinPacket, QuitPacket, ServerPacket, WelcomePacket} from "@/lib/packet.ts";
import RoomManager from "@/lib/room_manager.ts";

const logger = new Logger();
const roomManager = new RoomManager(4)
const server = Bun.serve<ClientData>({
   port: 3000,
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

            webSocket.publish(webSocket.data.roomId, new JoinPacket(webSocket.data.uuid).toString())
            webSocket.subscribe(webSocket.data.roomId)
            webSocket.send(new WelcomePacket(webSocket.data.uuid, roomManager.getRoom(webSocket.data.roomId)).toString())
         } else {
            webSocket.close(1011, new ServerPacket("LIMIT", webSocket.data.roomId).toString())
         }
      },
      message: function (webSocket: ServerWebSocket<ClientData>, message: string | Buffer): void | Promise<void> {
         webSocket.publish(webSocket.data.roomId, message)
      },
      close(webSocket: ServerWebSocket<ClientData>, code: number, reason: string): void | Promise<void> {
         roomManager.leaveRoom(webSocket.data.roomId, webSocket.data.uuid)
         logger.info(`${webSocket.data.uuid} disconnected from room ${webSocket.data.roomId}`)

         webSocket.unsubscribe(webSocket.data.roomId)
         webSocket.publish(webSocket.data.roomId, new QuitPacket(webSocket.data.uuid).toString())
      }
   }
});

logger.info(`Listening on ${server.hostname}:${server.port}`)