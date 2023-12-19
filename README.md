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

# Packets

Room packets are prefixed with **ROOM_** and e.g. look like this:

```json
{
  "type": "ROOM_WELCOME",
  "data": {
    "uuid": "<uuid>",
    "room": {}
  }
}
```

Client packets need to be prefixed with **CLIENT_**, or they will not be broadcast. </br>
The Server will add a sender value to each packet which will we result in something like this:

```json
{
  "type": "CLIENT_MOVE",
  "sender": "<uuid>",
  "data": {}
}
```