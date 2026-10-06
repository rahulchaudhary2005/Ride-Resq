import { z } from "zod";

const coordinates = z
  .number()
  .finite();

const serviceCategorySchema =
  z.enum([
    "TOWING",
    "FLAT_TIRE",
    "BATTERY_JUMP",
    "FUEL_DELIVERY",
    "LOCKOUT",
    "MECHANICAL_REPAIR",
    "WINCHING",
    "EV_CHARGING",
  ]);

const vehicleClassSchema = z.enum(["SMALL", "MEDIUM", "HEAVY"]);

export const createRequestSchema =
  z.object({
    body: z.object({
      category: serviceCategorySchema,

      vehicleId:
        z.string().uuid().optional(),

      description:
        z.string().trim().max(500).optional(),

      pickupLat: coordinates
        .min(-90)
        .max(90),

      pickupLng: coordinates
        .min(-180)
        .max(180),

      pickupAddress:
        z.string().trim().min(1).max(500),

      dropLat:
        coordinates
          .min(-90)
          .max(90)
          .optional(),

      dropLng:
        coordinates
          .min(-180)
          .max(180)
          .optional(),

      dropAddress:
        z.string().trim().max(500).optional(),

      customerRequestedFare:
        z.number()
          .finite()
          .positive()
          .optional(),

      vehicleClass:
        vehicleClassSchema.optional(),
    }),
  });

export const quoteRequestSchema =
  z.object({
    body: z.object({
      category: serviceCategorySchema,

      pickupLat: coordinates
        .min(-90)
        .max(90),

      pickupLng: coordinates
        .min(-180)
        .max(180),

      dropLat:
        coordinates
          .min(-90)
          .max(90)
          .optional(),

      dropLng:
        coordinates
          .min(-180)
          .max(180)
          .optional(),

      vehicleClass:
        vehicleClassSchema.optional(),
    }),
  });

export const updateStatusSchema =
  z.object({
    body: z.object({
      status: z.enum([
        "ACCEPTED",
        "ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ]),

      cancelReason:
        z.string()
          .trim()
          .max(500)
          .optional(),
    }),

    params: z.object({
      id: z.string().uuid(),
    }),
  });

export const createOfferSchema =
  z.object({
    body: z.object({
      amount:
        z.number()
          .finite()
          .positive(),
    }),

    params: z.object({
      id: z.string().uuid(),
    }),
  });

export const acceptOfferSchema =
  z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
  });

export const rejectOfferSchema =
  z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
  });