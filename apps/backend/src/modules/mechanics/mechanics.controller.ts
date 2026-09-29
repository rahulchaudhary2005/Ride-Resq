import { Request, Response, NextFunction } from "express";
import { mechanicsService } from "./mechanics.service";
import { success } from "../../utils/apiResponse";
import { ApiError } from "../../utils/errors";

export const mechanicsController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await mechanicsService.getProfile(req.user.sub);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async updateCategories(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await mechanicsService.updateServiceCategories(req.user.sub, req.body.categories);
      return success(res, result, "Service categories updated");
    } catch (err) {
      next(err);
    }
  },

  async setOnline(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { isOnline, lat, lng } = req.body;
      const result = await mechanicsService.setOnlineStatus(req.user.sub, isOnline, lat, lng);
      return success(res, result, "Availability updated");
    } catch (err) {
      next(err);
    }
  },

  async submitVerification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await mechanicsService.submitVerificationDocs(req.user.sub, req.body);
      return success(res, result, "Verification documents submitted");
    } catch (err) {
      next(err);
    }
  },

  async listNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, category } = req.query as { lat: string; lng: string; category?: string };
      const result = await mechanicsService.listNearby(Number(lat), Number(lng), category as any);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },
};
