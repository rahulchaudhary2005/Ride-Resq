import { Request, Response, NextFunction } from "express";
import { ratingsService } from "./ratings.service";
import { success } from "../../utils/apiResponse";
import { ApiError } from "../../utils/errors";

export const ratingsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { requestId, stars, comment } = req.body;
      const result = await ratingsService.create(req.user.sub, requestId, stars, comment);
      return success(res, result, "Rating submitted", 201);
    } catch (err) {
      next(err);
    }
  },
};
