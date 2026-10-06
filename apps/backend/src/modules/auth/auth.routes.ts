import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { registerSchema, loginSchema, refreshSchema, startPhoneOtpSchema, verifyPhoneOtpSchema } from "./auth.validation";

const router = Router();

router.post("/otp/start", validate(startPhoneOtpSchema), authController.startPhoneOtp);
router.post("/otp/verify", validate(verifyPhoneOtpSchema), authController.verifyPhoneOtp);
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", authController.logout);

export default router;
