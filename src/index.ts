import {Logger} from "@/lib/logger.ts";
import RoomManager from "@/lib/room_manager.ts";
import startServer from "@/lib/server.ts";

const logger = new Logger();
const roomManager = new RoomManager(4)

const server = startServer(logger, roomManager)
logger.info(`Listening on ${server.hostname}:${server.port}`)