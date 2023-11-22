# aznopoly-server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run start
```

# Rooms

Server will upgrade all requests which start with /room/[a-z\d-]{6,} to a websocket request and
will subscribe the client to the desired room.
Every message sent will automatically be broadcast to room.