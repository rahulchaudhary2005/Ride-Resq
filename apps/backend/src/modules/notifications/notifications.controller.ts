import { Request, Response, NextFunction } from "express";
import { notificationsService } from "./notifications.service";
import { success } from "../../utils/apiResponse";
import { ApiError } from "../../utils/errors";

export const notificationsController = {
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await notificationsService.listMine(req.user.sub);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await notificationsService.markRead(req.user.sub, req.params.id);
      return success(res, null, "Marked as read");
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await notificationsService.markAllRead(req.user.sub);
      return success(res, null, "All notifications marked read");
    } catch (err) {
      next(err);
    }
  },
};
