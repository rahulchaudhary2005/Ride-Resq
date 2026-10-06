import { Server } from "socket.io";
import { AuthedSocket } from "../config/socket";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";
import { canAccessRequest } from "./request-access";

/**
 * Tracking flow:
 * - Mechanic app emits "tracking:update" with { requestId, lat, lng, heading } every few seconds.
 * - We persist a lightweight TrackingPoint and broadcast the position to the room
 *   "request:<requestId>" so the customer app (and admin live map) can render it live.
 * - Customer/admin clients emit "tracking:subscribe" with { requestId } to join that room.
 */
export function registerTrackingHandlers(io: Server, socket: AuthedSocket) {
  socket.on("tracking:subscribe", async (payload: unknown) => {
    const requestId = getRequestId(payload);
    if (!requestId) return;

    try {
      if (await canAccessRequest(requestId, socket)) socket.join(`request:${requestId}`);
    } catch (err) {
      logger.error("tracking:subscribe failed", err);
    }
  });

  socket.on("tracking:unsubscribe", (payload: unknown) => {
    const requestId = getRequestId(payload);
    if (requestId) socket.leave(`request:${requestId}`);
  });

  socket.on("tracking:update", async (payload: unknown) => {
    if (socket.role !== "MECHANIC" || !socket.userId || !isRecord(payload)) return;
    const requestId = getRequestId(payload);
    const { lat, lng, heading } = payload;
    if (
      !requestId ||
      !isCoordinate(lat, -90, 90) ||
      !isCoordinate(lng, -180, 180) ||
      (heading !== undefined && !isCoordinate(heading, 0, 360))
    ) return;

    try {
      if (!(await canAccessRequest(requestId, socket))) return;

      await prisma.trackingPoint.create({
        data: { requestId, lat, lng, heading },
      });

      await prisma.mechanicProfile.updateMany({
        where: { userId: socket.userId },
        data: { currentLat: lat, currentLng: lng, lastLocationUpdate: new Date() },
      });

      io.to(`request:${requestId}`).emit("tracking:position", {
        requestId,
        lat,
        lng,
        heading,
        timestamp: Date.now(),
      });
      io.to("admin:live").emit("admin:tracking", {
        requestId,
        lat,
        lng,
        heading,
        timestamp: Date.now(),
      });
    } catch (err) {
      logger.error("tracking:update failed", err);
    }
  });
}

function getRequestId(payload: unknown): string | null {
  if (!isRecord(payload) || typeof payload.requestId !== "string") return null;
  const requestId = payload.requestId.trim();
  return requestId.length > 0 && requestId.length <= 64 ? requestId : null;
}

function isCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
