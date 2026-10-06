import { z } from "zod";

const indianMobileSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, "Phone must be a valid Indian mobile number in +91 format, e.g. +919876543210");

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: indianMobileSchema,
    password: z.string().min(8),
    phoneVerificationToken: z.string().min(1),
    role: z.enum(["CUSTOMER", "MECHANIC"]).default("CUSTOMER"),
  }),
});

export const startPhoneOtpSchema = z.object({
  body: z.object({
    phone: indianMobileSchema,
  }),
});

export const verifyPhoneOtpSchema = z.object({
  body: z.object({
    phone: indianMobileSchema,
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code sent to your phone"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});
