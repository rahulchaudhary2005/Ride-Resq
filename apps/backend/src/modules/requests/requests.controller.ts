import {
  Request,
  Response,
  NextFunction,
} from "express";

import { requestsService } from "./requests.service";

import { success } from "../../utils/apiResponse";

import { ApiError } from "../../utils/errors";

export const requestsController = {
  async listAvailable(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await requestsService.listAvailableForMechanic(req.user.sub);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const result =
        await requestsService.create({
          customerId: req.user.sub,
          ...req.body,
        });

      return success(
        res,
        result,
        "Service request created",
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  async quote(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const result =
        await requestsService.quote(
          req.body,
        );

      return success(
        res,
        result,
        "Fare quote calculated",
      );
    } catch (err) {
      next(err);
    }
  },

  async createOffer(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const amount =
        Number(req.body.amount);

      const result =
        await requestsService.createOffer(
          req.params.id,
          req.user.sub,
          amount,
        );

      return success(
        res,
        result,
        "Fare offer submitted",
      );
    } catch (err) {
      next(err);
    }
  },

  async acceptOffer(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const result =
        await requestsService.acceptOffer(
          req.params.id,
          req.user.sub,
        );

      return success(
        res,
        result,
        "Fare offer accepted",
      );
    } catch (err) {
      next(err);
    }
  },

  async rejectOffer(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const result =
        await requestsService.rejectOffer(
          req.params.id,
          req.user.sub,
        );

      return success(
        res,
        result,
        "Fare offer rejected",
      );
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const {
        status,
        cancelReason,
      } = req.body;

      const result =
        await requestsService.updateStatus(
          req.params.id,
          req.user.sub,
          req.user.role,
          status,
          {
            cancelReason,
          },
        );

      return success(
        res,
        result,
        "Request status updated",
      );
    } catch (err) {
      next(err);
    }
  },

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const result =
        await requestsService.getById(
          req.params.id,
          req.user.sub,
          req.user.role,
        );

      return success(
        res,
        result,
      );
    } catch (err) {
      next(err);
    }
  },

  async listChatMessages(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await requestsService.listChatMessages(
        req.params.id,
        req.user.sub,
        req.user.role,
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  async listMine(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      if (
        req.user.role !== "CUSTOMER" &&
        req.user.role !== "MECHANIC"
      ) {
        throw ApiError.forbidden(
          "Only customers and mechanics can view their requests",
        );
      }

      const result =
        await requestsService.listForUser(
          req.user.sub,
          req.user.role,
        );

      return success(
        res,
        result,
      );
    } catch (err) {
      next(err);
    }
  },
};