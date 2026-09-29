import { prisma } from "../config/db";
import { env } from "../config/env";
import { ApiError } from "../utils/errors";
import { ServiceCategory } from "@prisma/client";

export interface FareCalculation {
  estimatedFare: number;
  distanceKm: number;
  baseFare: number;
  perKmRate: number;
  distanceFare: number;
  surgeMultiplier: number;
  minFare: number;
  pricingVersion: number;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteResult {
  distanceKm: number;
  durationMinutes: number | null;
  polyline: string | null;
}

/**
 * Calculate the customer fare from the authoritative
 * ServicePricing database row.
 *
 * Formula:
 *
 *   baseFare
 *   + (distanceKm × perKmRate)
 *   × surgeMultiplier
 *
 * Then enforce minimum fare.
 *
 * The client NEVER supplies the authoritative pricing.
 */
export async function calculateFare(
  category: ServiceCategory,
  origin: Coordinates,
  destination?: Coordinates,
): Promise<FareCalculation> {
  validateCoordinates(origin, "origin");

  if (destination) {
    validateCoordinates(destination, "destination");
  }

  const pricing = await prisma.servicePricing.findUnique({
    where: {
      category,
    },
  });

  if (!pricing || !pricing.isActive) {
    throw ApiError.badRequest(
      `Pricing is currently unavailable for ${category}`,
    );
  }

  let distanceKm = 0;

  if (destination) {
    const route = await getRoute(origin, destination);
    distanceKm = route.distanceKm;
  }

  const baseFare = Number(pricing.baseFare);
  const perKmRate = Number(pricing.perKmRate);
  const minFare = Number(pricing.minFare);
  const surgeMultiplier = Number(pricing.surgeMultiplier);

  if (
    !Number.isFinite(baseFare) ||
    !Number.isFinite(perKmRate) ||
    !Number.isFinite(minFare) ||
    !Number.isFinite(surgeMultiplier)
  ) {
    throw ApiError.internal(
      "Invalid pricing configuration",
    );
  }

  if (
    baseFare < 0 ||
    perKmRate < 0 ||
    minFare < 0 ||
    surgeMultiplier <= 0
  ) {
    throw ApiError.internal(
      "Invalid pricing configuration",
    );
  }

  const distanceFare = distanceKm * perKmRate;

  const calculated =
    (baseFare + distanceFare) *
    surgeMultiplier;

  const estimatedFare = roundMoney(
    Math.max(calculated, minFare),
  );

  return {
    estimatedFare,
    distanceKm: roundDistance(distanceKm),
    baseFare: roundMoney(baseFare),
    perKmRate: roundMoney(perKmRate),
    distanceFare: roundMoney(distanceFare),
    surgeMultiplier,
    minFare: roundMoney(minFare),
    pricingVersion: pricing.pricingVersion,
  };
}

/**
 * Backward-compatible helper.
 *
 * When no destination is available:
 * only the configured base fare and minimum fare
 * participate in the calculation.
 */
export async function estimateFare(
  category: ServiceCategory,
  lat: number,
  lng: number,
): Promise<number> {
  const result = await calculateFare(
    category,
    {
      lat,
      lng,
    },
  );

  return result.estimatedFare;
}

/**
 * Calculate an actual driving route using
 * Google Maps Routes API.
 *
 * Endpoint:
 * POST
 * https://routes.googleapis.com/directions/v2:computeRoutes
 *
 * Production:
 * Google Maps API key is required.
 *
 * Development:
 * Haversine distance is used only when the
 * Google API key is not configured.
 */
export async function getRoute(
  origin: Coordinates,
  destination: Coordinates,
): Promise<RouteResult> {
  validateCoordinates(origin, "origin");
  validateCoordinates(destination, "destination");

  if (!env.GOOGLE_MAPS_API_KEY) {
    if (env.NODE_ENV !== "production") {
      console.warn(
        "GOOGLE_MAPS_API_KEY is not configured. Using development-only Haversine fallback.",
      );

      const distanceKm = haversineKm(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng,
      );

      return {
        distanceKm,
        durationMinutes: null,
        polyline: null,
      };
    }

    throw ApiError.internal(
      "Google Maps routing is not configured",
    );
  }

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "X-Goog-Api-Key":
          env.GOOGLE_MAPS_API_KEY,

        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },

      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng,
            },
          },
        },

        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },

        travelMode: "DRIVE",

        routingPreference: "TRAFFIC_AWARE",

        computeAlternativeRoutes: false,

        languageCode: "en-IN",

        units: "METRIC",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();

    console.error(
      "Google Routes API error:",
      body,
    );

    throw ApiError.internal(
      "Unable to calculate route distance",
    );
  }

  const data = (await response.json()) as {
    routes?: Array<{
      distanceMeters?: number;

      duration?: string;

      polyline?: {
        encodedPolyline?: string;
      };
    }>;
  };

  const route = data.routes?.[0];

  if (
    !route ||
    typeof route.distanceMeters !== "number" ||
    !Number.isFinite(route.distanceMeters)
  ) {
    throw ApiError.badRequest(
      "No drivable route could be calculated",
    );
  }

  const distanceKm =
    route.distanceMeters / 1000;

  let durationMinutes:
    | number
    | null = null;

  if (route.duration) {
    const seconds = Number(
      route.duration.replace("s", ""),
    );

    if (Number.isFinite(seconds)) {
      durationMinutes = Math.round(
        seconds / 60,
      );
    }
  }

  return {
    distanceKm,
    durationMinutes,
    polyline:
      route.polyline?.encodedPolyline ??
      null,
  };
}

/**
 * Validate latitude and longitude.
 */
function validateCoordinates(
  coordinates: Coordinates,
  name: string,
): void {
  if (
    !Number.isFinite(coordinates.lat) ||
    !Number.isFinite(coordinates.lng) ||
    coordinates.lat < -90 ||
    coordinates.lat > 90 ||
    coordinates.lng < -180 ||
    coordinates.lng > 180
  ) {
    throw ApiError.badRequest(
      `Invalid ${name} coordinates`,
    );
  }
}

/**
 * Development-only straight-line distance fallback.
 */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) =>
    (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const clampedA = Math.min(
    1,
    Math.max(0, a),
  );

  return (
    earthRadiusKm *
    2 *
    Math.atan2(
      Math.sqrt(clampedA),
      Math.sqrt(1 - clampedA),
    )
  );
}

/**
 * Money should always be represented with
 * two decimal places.
 */
function roundMoney(
  value: number,
): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

/**
 * Distance is stored with 3 decimal places
 * because distance precision matters more than
 * currency precision.
 */
function roundDistance(
  value: number,
): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 1000,
    ) / 1000
  );
}