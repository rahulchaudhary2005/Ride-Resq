import { Server } from "socket.io";
import { AuthedSocket } from "../config/socket";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";
import { canAccessRequest } from "./request-access";

export function registerChatHandlers(io: Server, socket: AuthedSocket) {
  socket.on("chat:leave", (payload: unknown) => {
    const requestId = getRequestId(payload);
    if (requestId) socket.leave(`chat:${requestId}`);
  });

  socket.on("chat:join", async (payload: unknown) => {
    const requestId = getRequestId(payload);
    if (!requestId) return;

    try {
      if (await canAccessRequest(requestId, socket)) socket.join(`chat:${requestId}`);
    } catch (err) {
      logger.error("chat:join failed", err);
    }
  });

  socket.on("chat:message", async (payload: unknown) => {
    if (!socket.userId || !socket.role || !isRecord(payload)) return;
    const requestId = getRequestId(payload);
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (!requestId || !message || message.length > 2000) return;

    try {
      if (!(await canAccessRequest(requestId, socket))) return;

      const saved = await prisma.chatMessage.create({
        data: {
          requestId,
          senderId: socket.userId,
          senderRole: socket.role as any,
          message,
        },
      });

      io.to(`chat:${requestId}`).emit("chat:message", saved);
      io.to("admin:live").emit("admin:activity", {
        type: "CHAT_MESSAGE",
        request: { id: requestId },
        senderRole: socket.role,
        timestamp: saved.sentAt,
      });
    } catch (err) {
      logger.error("chat:message failed", err);
    }
  });
}

function getRequestId(payload: unknown): string | null {
  if (!isRecord(payload) || typeof payload.requestId !== "string") return null;
  const requestId = payload.requestId.trim();
  return requestId.length > 0 && requestId.length <= 64 ? requestId : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
