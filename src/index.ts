import {Server, ServerWebSocket} from "bun";
import {ClientData} from "@/types.ts";
import {handleHealthEndpoints} from "@/routes/health.ts";
import {Logger} from "@/lib/logger.ts";

const logger = new Logger();
const server = Bun.serve<ClientData>({
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

            // Check if a username is provided
            if (!request.headers.has('X-Username')) {
               logger.warning("Request with missing header was sent")
               return new Response(JSON.stringify({message: "Username is required"}), {status: 400})
            }

            const success = server.upgrade(request, {
               data: {
                  roomId: roomId,
                  username: request.headers.get('X-Username')
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
         logger.info(`${webSocket.data.username} connected to room ${webSocket.data.roomId}`)
         webSocket.subscribe(webSocket.data.roomId)
         webSocket.publish(webSocket.data.roomId, `${webSocket.data.username}: joined the room`)
      },
      message: function (webSocket: ServerWebSocket<ClientData>, message: string | Buffer): void | Promise<void> {
         webSocket.publish(webSocket.data.roomId, `${webSocket.data.username}: ${message}`)
      },
      close(webSocket: ServerWebSocket<ClientData>, code: number, reason: string): void | Promise<void> {
         logger.info(`${webSocket.data.username} disconnected from room ${webSocket.data.roomId}`)
         webSocket.unsubscribe(webSocket.data.roomId)
         webSocket.publish(webSocket.data.roomId, `${webSocket.data.username}: left the room`)
      }
   }
});

logger.info(`Listening on ${server.hostname}:${server.port}`)