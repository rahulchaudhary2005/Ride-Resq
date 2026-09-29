import { Router } from "express";
import { paymentsController } from "./payments.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// Webhooks are unauthenticated (verified via provider signature instead)
router.post("/webhook/stripe", paymentsController.stripeWebhook);
router.post("/webhook/razorpay", paymentsController.razorpayWebhook);

router.use(authMiddleware);
router.post("/intent", paymentsController.createIntent);
router.post("/confirm", paymentsController.confirm);

export default router;
