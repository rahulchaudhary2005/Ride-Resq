// Shared zod schemas for forms that exist on both a mobile/web client and the backend
// (e.g. signup, service request creation) so validation rules stay in one place.
import { z } from "zod";

export const signupFormSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(8, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const serviceRequestFormSchema = z.object({
  category: z.enum([
    "TOWING",
    "FLAT_TIRE",
    "BATTERY_JUMP",
    "FUEL_DELIVERY",
    "LOCKOUT",
    "MECHANICAL_REPAIR",
    "WINCHING",
    "EV_CHARGING",
  ]),
  description: z.string().max(500).optional(),
  pickupAddress: z.string().min(3, "Pickup address is required"),
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type ServiceRequestFormValues = z.infer<typeof serviceRequestFormSchema>;
