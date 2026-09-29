import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors";
import { AuthPayload } from "./auth.middleware";

export function requireRole(...roles: AuthPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have access to this resource"));
    }
    next();
  };
}
