import { Server } from "socket.io";
import { AuthedSocket } from "../config/socket";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";

/**
 * Tracking flow:
 * - Mechanic app emits "tracking:update" with { requestId, lat, lng, heading } every few seconds.
 * - We persist a lightweight TrackingPoint and broadcast the position to the room
 *   "request:<requestId>" so the customer app (and admin live map) can render it live.
 * - Customer/admin clients emit "tracking:subscribe" with { requestId } to join that room.
 */
export function registerTrackingHandlers(io: Server, socket: AuthedSocket) {
  socket.on("tracking:subscribe", ({ requestId }: { requestId: string }) => {
    socket.join(`request:${requestId}`);
  });

  socket.on("tracking:unsubscribe", ({ requestId }: { requestId: string }) => {
    socket.leave(`request:${requestId}`);
  });

  socket.on(
    "tracking:update",
    async ({
      requestId,
      lat,
      lng,
      heading,
    }: {
      requestId: string;
      lat: number;
      lng: number;
      heading?: number;
    }) => {
      try {
        // Persist for history/audit (kept lightweight; consider a TTL/archival job in prod)
        await prisma.trackingPoint.create({
          data: { requestId, lat, lng, heading },
        });

        // Also keep the mechanic's latest known location on their profile
        if (socket.userId) {
          await prisma.mechanicProfile.updateMany({
            where: { userId: socket.userId },
            data: { currentLat: lat, currentLng: lng, lastLocationUpdate: new Date() },
          });
        }

        io.to(`request:${requestId}`).emit("tracking:position", {
          requestId,
          lat,
          lng,
          heading,
          timestamp: Date.now(),
        });
      } catch (err) {
        logger.error("tracking:update failed", err);
      }
    }
  );
}
