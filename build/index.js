// src/index.ts
var server = Bun.serve({
  fetch(request, server2) {
    const url = new URL(request.url);
    let routes = url.pathname.split("/");
    if (routes[1].toLowerCase() === "room") {
      if (routes.length < 3) {
        return new Response("No roomId provided", { status: 400 });
      }
      let roomId = routes[2].toLowerCase();
      if (roomId.length < 6) {
        return new Response("Invalid roomId provided", { status: 400 });
      }
      if (!request.headers.has("X-Username")) {
        return new Response("Username is required", { status: 400 });
      }
      const success = server2.upgrade(request, {
        data: {
          roomId,
          username: request.headers.get("X-Username")
        }
      });
      return success ? undefined : new Response("WebSocket upgrade error", { status: 400 });
    }
    return new Response("No route found", { status: 404 });
  },
  websocket: {
    open(webSocket) {
      console.log(`${webSocket.data.username} connected to room ${webSocket.data.roomId}`);
      webSocket.subscribe(webSocket.data.roomId);
      webSocket.publish(webSocket.data.roomId, `${webSocket.data.username}: joined the room`);
    },
    message: function(webSocket, message) {
      webSocket.publish(webSocket.data.roomId, `${webSocket.data.username}: ${message}`);
    },
    close(webSocket, code, reason) {
      console.log(`${webSocket.data.username} disconnected from room ${webSocket.data.roomId}`);
      webSocket.unsubscribe(webSocket.data.roomId);
      webSocket.publish(webSocket.data.roomId, `${webSocket.data.username}: left the room`);
    }
  }
});
console.log(`Listening on ${server.hostname}:${server.port}`);
