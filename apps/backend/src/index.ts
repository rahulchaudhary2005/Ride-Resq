import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { initSocket } from "./config/socket";
import { logger } from "./utils/logger";

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Attach Socket.io for real-time tracking & chat
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`RoadGuard backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error("Fatal error during bootstrap", err);
  process.exit(1);
});
