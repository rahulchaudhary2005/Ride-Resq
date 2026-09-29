import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { logger } from "../utils/logger";
import { registerTrackingHandlers } from "../sockets/tracking.socket";
import { registerChatHandlers } from "../sockets/chat.socket";
import { registerRequestHandlers } from "../sockets/request.socket";

export interface AuthedSocket extends Socket {
  userId?: string;
  role?: string;
}

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
    },
  });

  // Authenticate every socket connection via JWT (sent in handshake auth)
  io.use((socket: AuthedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Unauthorized: no token provided"));

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        sub: string;
        role: string;
      };
      socket.userId = payload.sub;
      socket.role = payload.role;
      next();
    } catch (err) {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId}, role: ${socket.role})`);

    // Each user joins a personal room for direct notifications
    if (socket.userId) socket.join(`user:${socket.userId}`);

    registerTrackingHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerRequestHandlers(io, socket);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket first.");
  return io;
}
