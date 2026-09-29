import winston from "winston";
import { env } from "../config/env";

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === "development" ? winston.format.simple() : winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
