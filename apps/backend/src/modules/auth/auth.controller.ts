import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { success } from "../../utils/apiResponse";

export const authController = {
  async startPhoneOtp(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.startPhoneOtp(req.body.phone);
      return success(res, null, "Verification code sent");
    } catch (err) {
      next(err);
    }
  },

  async verifyPhoneOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const verificationToken = await authService.verifyPhoneOtp(req.body.phone, req.body.code);
      return success(res, { verificationToken }, "Phone verified");
    } catch (err) {
      next(err);
    }
  },

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
