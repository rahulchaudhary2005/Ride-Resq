import { Router } from "express";

import { requestsController } from "./requests.controller";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";

import {
  createRequestSchema,
  quoteRequestSchema,
  updateStatusSchema,
} from "./requests.validation";

const router = Router();

router.use(authMiddleware);

/**
 * Customer asks:
 * "What will this service cost?"
 *
 * This does NOT create a request.
 */
router.post(
  "/quote",
  requireRole("CUSTOMER"),
  validate(quoteRequestSchema),
  requestsController.quote,
);

/**
 * Customer creates the actual request.
 */
router.post(
  "/",
  requireRole("CUSTOMER"),
  validate(createRequestSchema),
  requestsController.create,
);

router.get(
  "/mine",
  requestsController.listMine,
);

router.get(
  "/:id",
  requestsController.getById,
);

router.patch(
  "/:id/status",
  requireRole(
    "CUSTOMER",
    "MECHANIC",
    "ADMIN",
  ),
  validate(updateStatusSchema),
  requestsController.updateStatus,
);

export default router;