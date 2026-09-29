// Shared TypeScript types used across backend, mobile apps, and admin-web.
// Keep these in sync with apps/backend/prisma/schema.prisma enums/models.

export type Role = "CUSTOMER" | "MECHANIC" | "ADMIN";

export type ServiceCategory =
  | "TOWING"
  | "FLAT_TIRE"
  | "BATTERY_JUMP"
  | "FUEL_DELIVERY"
  | "LOCKOUT"
  | "MECHANICAL_REPAIR"
  | "WINCHING"
  | "EV_CHARGING";

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_MECHANIC_FOUND";

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color?: string | null;
  vehicleType: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  mechanicId?: string | null;
  vehicleId?: string | null;
  category: ServiceCategory;
  status: RequestStatus;
  description?: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropLat?: number | null;
  dropLng?: number | null;
  dropAddress?: string | null;
  estimatedFare?: number | null;
  finalFare?: number | null;

  agreedFare?: number | null;

  fareMode?:
  | "AUTOMATIC"
  | "CUSTOMER_OFFER";

  customerRequestedFare?: number | null;

  fareOfferStatus?:
  | "NONE"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

  distanceKm?: number | null;

  pricingBaseFareSnapshot?: number | null;
  pricingPerKmRateSnapshot?: number | null;
  pricingMinFareSnapshot?: number | null;
  pricingSurgeSnapshot?: number | null;
  pricingVersionSnapshot?: number | null;
  requestedAt: string;
  acceptedAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface TrackingPosition {
  requestId: string;
  lat: number;
  lng: number;
  heading?: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: Role;
  message: string;
  sentAt: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

// Socket.io event name constants, shared between backend and clients
// to avoid string-literal typos across the codebase.
export const SOCKET_EVENTS = {
  TRACKING_SUBSCRIBE: "tracking:subscribe",
  TRACKING_UNSUBSCRIBE: "tracking:unsubscribe",
  TRACKING_UPDATE: "tracking:update",
  TRACKING_POSITION: "tracking:position",
  CHAT_JOIN: "chat:join",
  CHAT_MESSAGE: "chat:message",
  REQUEST_NEW: "request:new",
  REQUEST_STATUS: "request:status",
  MECHANIC_AVAILABILITY: "mechanic:availability",
} as const;
