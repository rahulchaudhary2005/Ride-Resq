import { z } from "zod";

export const createRatingSchema = z.object({
  body: z.object({
    requestId: z.string().uuid(),
    stars: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional(),
  }),
});
