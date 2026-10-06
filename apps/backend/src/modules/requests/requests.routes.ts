import { Router } from "express";

import { requestsController } from "./requests.controller";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";

import {
  createRequestSchema,
  quoteRequestSchema,
  createOfferSchema,
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
  "/available",
  requireRole("MECHANIC"),
  requestsController.listAvailable,
);

router.get(
  "/mine",
  requestsController.listMine,
);

router.get(
  "/:id/messages",
  requestsController.listChatMessages,
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

router.post(
  "/:id/offer",
  requireRole("CUSTOMER"),
  validate(createOfferSchema),
  requestsController.createOffer,
);

router.post(
  "/:id/offer/accept",
  requireRole("MECHANIC"),
  requestsController.acceptOffer,
);

router.post(
  "/:id/offer/reject",
  requireRole("MECHANIC"),
  requestsController.rejectOffer,
);

export default router;