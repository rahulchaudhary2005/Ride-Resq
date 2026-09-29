import { Request, Response, NextFunction } from "express";
import { vehiclesService } from "./vehicles.service";
import { success } from "../../utils/apiResponse";
import { ApiError } from "../../utils/errors";

export const vehiclesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await vehiclesService.create(req.user.sub, req.body);
      return success(res, result, "Vehicle added", 201);
    } catch (err) {
      next(err);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await vehiclesService.listMine(req.user.sub);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await vehiclesService.remove(req.user.sub, req.params.id);
      return success(res, null, "Vehicle removed");
    } catch (err) {
      next(err);
    }
  },
};
