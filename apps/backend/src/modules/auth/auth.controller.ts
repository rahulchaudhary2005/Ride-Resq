import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { success } from "../../utils/apiResponse";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return success(res, result, "Registered successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return success(res, result, "Logged in successfully");
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refresh(refreshToken);
      return success(res, tokens, "Token refreshed");
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return success(res, null, "Logged out successfully");
    } catch (err) {
      next(err);
    }
  },
};
