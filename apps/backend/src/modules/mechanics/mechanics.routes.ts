import { Router } from "express";
import { mechanicsController } from "./mechanics.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();

router.get("/nearby", mechanicsController.listNearby);

router.use(authMiddleware);
router.get("/me", requireRole("MECHANIC"), mechanicsController.getMe);
router.patch("/me/categories", requireRole("MECHANIC"), mechanicsController.updateCategories);
router.patch("/me/availability", requireRole("MECHANIC"), mechanicsController.setOnline);
router.post("/me/verification", requireRole("MECHANIC"), mechanicsController.submitVerification);

export default router;
