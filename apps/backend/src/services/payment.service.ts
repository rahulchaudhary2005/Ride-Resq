import crypto from "crypto";
import Stripe from "stripe";
import Razorpay from "razorpay";

import { env } from "../config/env";
import { prisma } from "../config/db";
import { getIO } from "../config/socket";
import { ApiError } from "../utils/errors";

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

const razorpay =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    })
    : null;

const PLATFORM_FEE_PERCENT = 0.15;

function verifyRazorpayWebhookSignature(
  rawBody: Buffer,
  signature: string,
  secret: string
) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export const paymentService = {
  async createIntent(
    requestId: string,
    provider: "STRIPE" | "RAZORPAY",
    customerId: string
  ) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        payment: true,
      },
    });

    if (!request) {
      throw ApiError.notFound("Service request not found");
    }

    // Customer can only create payment for their own request.
    if (request.customerId !== customerId) {
      throw ApiError.forbidden("You cannot pay for this request");
    }

    // Payment should only happen after service completion.
    if (request.status !== "COMPLETED") {
      throw ApiError.badRequest(
        "Payment can only be created after service completion"
      );
    }

    if (request.payment?.status === "PAID") {
      return request.payment;
    }

    const amount = Number(
      request.finalFare ??
      request.agreedFare ??
      request.estimatedFare ??
      0
    );

    if (amount <= 0) {
      throw ApiError.badRequest("Invalid fare amount");
    }

    const taxAmount = Number(request.distanceTaxSnapshot ?? 0);
    const taxableServiceAmount = Math.max(0, amount - taxAmount);
    const platformFee = +(taxableServiceAmount * PLATFORM_FEE_PERCENT).toFixed(2);
    const mechanicPayout = +(taxableServiceAmount - platformFee).toFixed(2);

    let providerRef: string;

    if (provider === "STRIPE") {
      if (!stripe) {
        throw ApiError.internal("Stripe is not configured");
      }

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "inr",
        metadata: {
          requestId,
        },
      });

      providerRef = intent.id;
    } else {
      if (!razorpay) {
        throw ApiError.internal("Razorpay is not configured");
      }

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: requestId,
        notes: {
          requestId,
        },
      });

      providerRef = order.id;
    }

    const payment = await prisma.payment.upsert({
      where: {
        requestId,
      },

      create: {
        requestId,
        amount,
        provider,
        providerRef,
        platformFee,
        mechanicPayout,
        taxAmount,
      },

      update: {
        provider,
        providerRef,
        amount,
        platformFee,
        mechanicPayout,
        taxAmount,
      },
    });

    getIO().to("admin:live").emit("admin:activity", {
      type: "PAYMENT_STARTED",
      request: { id: requestId, status: request.status },
      payment,
      timestamp: new Date().toISOString(),
    });
    return payment;
  },

  /**
   * Marks a payment as PAID exactly once.
   *
   * The important part is:
   * status must change from non-PAID -> PAID atomically.
   *
   * Only the transaction that actually changes the status
   * is allowed to credit the mechanic wallet.
   */
  async markPaid(
    requestId: string,
    providerRef?: string
  ) {
    const outcome = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { requestId },
      });

      if (!payment) {
        throw ApiError.notFound("Payment not found");
      }

      // Already processed.
      if (payment.status === "PAID") {
        return { payment, newlyPaid: false, requestStatus: null };
      }

      if (
        providerRef &&
        payment.providerRef &&
        payment.providerRef !== providerRef
      ) {
        throw ApiError.badRequest("Payment provider reference mismatch");
      }

      // Atomic transition.
      const result = await tx.payment.updateMany({
        where: {
          requestId,
          status: {
            not: "PAID",
          },
        },
        data: {
          status: "PAID",
        },
      });

      // Another webhook/request won the race.
      if (result.count === 0) {
        return {
          payment: await tx.payment.findUniqueOrThrow({ where: { requestId } }),
          newlyPaid: false,
          requestStatus: null,
        };
      }

      const request = await tx.serviceRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw ApiError.notFound("Service request not found");
      }

      if (request.mechanicId) {
        await tx.mechanicProfile.update({
          where: {
            id: request.mechanicId,
          },
          data: {
            walletBalance: {
              increment: payment.mechanicPayout,
            },
          },
        });
      }

      const paidPayment = await tx.payment.findUniqueOrThrow({ where: { requestId } });
      return { payment: paidPayment, newlyPaid: true, requestStatus: request.status };
    });

    if (outcome.newlyPaid) {
      getIO().to("admin:live").emit("admin:activity", {
        type: "PAYMENT_CONFIRMED",
        request: { id: requestId, status: outcome.requestStatus },
        payment: outcome.payment,
        timestamp: new Date().toISOString(),
      });
    }
    return outcome.payment;
  },

  verifyRazorpayWebhook(
    rawBody: Buffer,
    signature: string
  ) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw ApiError.internal(
        "Razorpay webhook secret is not configured"
      );
    }

    if (!signature) {
      throw ApiError.unauthorized(
        "Missing Razorpay webhook signature"
      );
    }

    if (!verifyRazorpayWebhookSignature(
      rawBody,
      signature,
      env.RAZORPAY_WEBHOOK_SECRET
    )) {
      throw ApiError.unauthorized(
        "Invalid Razorpay webhook signature"
      );
    }

    return true;
  },
};