import { Router } from "express";
import { notificationsController } from "./notifications.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/mine", notificationsController.listMine);
router.patch("/:id/read", notificationsController.markRead);
router.patch("/read-all", notificationsController.markAllRead);

export default router;
