import { Request, Response, NextFunction } from "express";
import { mechanicsService } from "./mechanics.service";
import { success } from "../../utils/apiResponse";
import { ApiError } from "../../utils/errors";
import { ServiceCategory } from "@prisma/client";
import { getIO } from "../../config/socket";

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
      getIO().to("admin:live").emit("admin:activity", {
        type: "MECHANIC_AVAILABILITY_CHANGED",
        mechanicUserId: req.user.sub,
        isOnline,
        timestamp: new Date().toISOString(),
      });
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
      const latitude = Number(lat);
      const longitude = Number(lng);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw ApiError.badRequest("A valid latitude is required");
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw ApiError.badRequest("A valid longitude is required");
      }
      if (category && !Object.values(ServiceCategory).includes(category as ServiceCategory)) {
        throw ApiError.badRequest("A valid service category is required");
      }

      const result = await mechanicsService.listNearby(latitude, longitude, category as any);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },
};
