import { Request, Response, NextFunction } from "express";

import { paymentService } from "../../services/payment.service";
import { success } from "../../utils/apiResponse";
import { ApiError } from "../../utils/errors";
import { env } from "../../config/env";
import Stripe from "stripe";

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export const paymentsController = {
  async createIntent(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const {
        requestId,
        provider,
      } = req.body;

      if (
        provider !== "STRIPE" &&
        provider !== "RAZORPAY"
      ) {
        throw ApiError.badRequest(
          "Unsupported payment provider"
        );
      }

      const result = await paymentService.createIntent(
        requestId,
        provider,
        req.user.sub
      );

      return success(
        res,
        result,
        "Payment intent created"
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * IMPORTANT:
   *
   * This endpoint does NOT mark payment as PAID.
   *
   * The provider webhook is the source of truth.
   */
  async confirm(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      return success(
        res,
        {
          status: "PENDING_WEBHOOK_CONFIRMATION",
        },
        "Payment is awaiting provider confirmation"
      );
    } catch (err) {
      next(err);
    }
  },

  async razorpayWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const rawBody = req.rawBody;

      if (!rawBody) {
        throw ApiError.badRequest(
          "Raw webhook body is required"
        );
      }

      const signature =
        req.headers["x-razorpay-signature"];

      if (typeof signature !== "string") {
        throw ApiError.unauthorized(
          "Missing Razorpay webhook signature"
        );
      }

      paymentService.verifyRazorpayWebhook(
        rawBody,
        signature
      );

      const event = req.body;

      /*
       * We only fulfill captured payments.
       *
       * Razorpay documents payment.captured as the
       * successful captured-payment event.
       */
      if (event.event === "payment.captured") {
        const paymentEntity =
          event.payload?.payment?.entity;

        const requestId =
          paymentEntity?.notes?.requestId;

        const providerRef =
          paymentEntity?.order_id;

        if (!requestId) {
          throw ApiError.badRequest(
            "Razorpay webhook missing requestId"
          );
        }

        await paymentService.markPaid(
          requestId,
          providerRef
        );
      }

      return res.json({
        received: true,
      });
    } catch (err) {
      next(err);
    }
  },

  async stripeWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!env.STRIPE_WEBHOOK_SECRET) {
        throw ApiError.internal(
          "Stripe webhook secret is not configured"
        );
      }

      if (!stripe) {
        throw ApiError.internal(
          "Stripe is not configured"
        );
      }

      const rawBody = req.rawBody;

      if (!rawBody) {
        throw ApiError.badRequest(
          "Raw webhook body is required"
        );
      }

      const signature =
        req.headers["stripe-signature"];

      if (typeof signature !== "string") {
        throw ApiError.unauthorized(
          "Missing Stripe signature"
        );
      }

      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      if (
        event.type ===
        "payment_intent.succeeded"
      ) {
        const paymentIntent =
          event.data.object;

        const requestId =
          paymentIntent.metadata?.requestId;

        if (!requestId) {
          throw ApiError.badRequest(
            "Stripe webhook missing requestId"
          );
        }

        await paymentService.markPaid(
          requestId,
          paymentIntent.id
        );
      }

      return res.json({
        received: true,
      });
    } catch (err) {
      next(err);
    }
  },
};