import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";
import { success } from "../../utils/apiResponse";

export const adminController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.dashboardStats();
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async listMechanics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listMechanics(req.query.status as any);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async verifyMechanic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.setMechanicVerification(req.params.id, req.body.status);
      return success(res, result, "Mechanic verification updated");
    } catch (err) {
      next(err);
    }
  },

  async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listAllRequests(req.query.status as string | undefined);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async upsertPricing(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, ...data } = req.body;
      const result = await adminService.upsertPricing(category, data);
      return success(res, result, "Pricing updated");
    } catch (err) {
      next(err);
    }
  },

  async listPricing(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listPricing();
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async listVehicleTaxRules(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listVehicleTaxRules();
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async upsertVehicleTaxRule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.upsertVehicleTaxRule(req.body.vehicleClass, req.body.perKmRate);
      return success(res, result, "Vehicle distance tax updated");
    } catch (err) {
      next(err);
    }
  },

  async listSupportTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listSupportTickets(req.query.status as string | undefined);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },
};
