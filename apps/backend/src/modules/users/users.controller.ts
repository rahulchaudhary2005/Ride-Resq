import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";
import { success } from "../../utils/apiResponse";
import { ApiError } from "../../utils/errors";

export const usersController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await usersService.getById(req.user.sub);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await usersService.updateProfile(req.user.sub, req.body);
      return success(res, result, "Profile updated");
    } catch (err) {
      next(err);
    }
  },
};
