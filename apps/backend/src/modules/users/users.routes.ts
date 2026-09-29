import { Router } from "express";
import { usersController } from "./users.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/me", usersController.getMe);
router.patch("/me", usersController.updateMe);

export default router;
