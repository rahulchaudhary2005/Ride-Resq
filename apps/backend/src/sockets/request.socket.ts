import { Server } from "socket.io";
import { AuthedSocket } from "../config/socket";

/**
 * These handlers are for client-side subscriptions only.
 * Actual request-status mutations happen via REST (see modules/requests) and
 * are broadcast to relevant rooms from there via getIO() — this keeps a single
 * source of truth for state transitions while still delivering realtime updates.
 */
export function registerRequestHandlers(_io: Server, socket: AuthedSocket) {
  socket.on("mechanic:availability", ({ isOnline }: { isOnline: boolean }) => {
    // Broadcast to an "admin:live" room so the admin dashboard can show online mechanics count.
    socket.broadcast.to("admin:live").emit("mechanic:availability", {
      mechanicUserId: socket.userId,
      isOnline,
    });
  });

  if (socket.role === "ADMIN") {
    socket.join("admin:live");
  }
}
