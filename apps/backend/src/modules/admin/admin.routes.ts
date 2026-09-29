import { Router } from "express";
import { adminController } from "./admin.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";

const router = Router();

router.use(authMiddleware, requireRole("ADMIN"));

router.get("/dashboard", adminController.dashboard);
router.get("/mechanics", adminController.listMechanics);
router.patch("/mechanics/:id/verification", adminController.verifyMechanic);
router.get("/requests", adminController.listRequests);
router.get("/pricing", adminController.listPricing);
router.put("/pricing", adminController.upsertPricing);
router.get("/support-tickets", adminController.listSupportTickets);

export default router;
