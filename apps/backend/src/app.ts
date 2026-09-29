import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import mechanicRoutes from "./modules/mechanics/mechanics.routes";
import vehicleRoutes from "./modules/vehicles/vehicles.routes";
import requestRoutes from "./modules/requests/requests.routes";
import paymentRoutes from "./modules/payments/payments.routes";
import ratingRoutes from "./modules/ratings/ratings.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import adminRoutes from "./modules/admin/admin.routes";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    })
  );
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  const apiRouter = express.Router();
  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/users", userRoutes);
  apiRouter.use("/mechanics", mechanicRoutes);
  apiRouter.use("/vehicles", vehicleRoutes);
  apiRouter.use("/requests", requestRoutes);
  apiRouter.use("/payments", paymentRoutes);
  apiRouter.use("/ratings", ratingRoutes);
  apiRouter.use("/notifications", notificationRoutes);
  apiRouter.use("/admin", adminRoutes);

  app.use("/api/v1", apiRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
