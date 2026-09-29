import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  logger.error("Unhandled error", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.NODE_ENV === "development" && { detail: String(err) }),
  });
}
