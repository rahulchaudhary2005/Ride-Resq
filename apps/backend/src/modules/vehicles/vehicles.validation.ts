import { z } from "zod";

export const createVehicleSchema = z.object({
  body: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1970).max(new Date().getFullYear() + 1),
    plateNumber: z.string().min(2),
    color: z.string().optional(),
    vehicleType: z.string().min(2),
  }),
});
