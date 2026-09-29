import { Server } from "socket.io";
import { AuthedSocket } from "../config/socket";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";

export function registerChatHandlers(io: Server, socket: AuthedSocket) {
  socket.on("chat:join", ({ requestId }: { requestId: string }) => {
    socket.join(`chat:${requestId}`);
  });

  socket.on(
    "chat:message",
    async ({ requestId, message }: { requestId: string; message: string }) => {
      if (!socket.userId || !socket.role) return;
      try {
        const saved = await prisma.chatMessage.create({
          data: {
            requestId,
            senderId: socket.userId,
            senderRole: socket.role as any,
            message,
          },
        });

        io.to(`chat:${requestId}`).emit("chat:message", saved);
      } catch (err) {
        logger.error("chat:message failed", err);
      }
    }
  );
}
