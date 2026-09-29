import { Router } from "express";
import { ratingsController } from "./ratings.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createRatingSchema } from "./ratings.validation";

const router = Router();
router.use(authMiddleware);

router.post("/", requireRole("CUSTOMER"), validate(createRatingSchema), ratingsController.create);

export default router;
