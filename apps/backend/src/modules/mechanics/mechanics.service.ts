import { prisma } from "../../config/db";
import { ApiError } from "../../utils/errors";
import { ServiceCategory } from "@prisma/client";

export const mechanicsService = {
  async getProfile(userId: string) {
    const profile = await prisma.mechanicProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
      },
    });
    if (!profile) throw ApiError.notFound("Mechanic profile not found");
    return profile;
  },

  async updateServiceCategories(userId: string, categories: ServiceCategory[]) {
    return prisma.mechanicProfile.update({
      where: { userId },
      data: { serviceCategories: categories },
    });
  },

  async setOnlineStatus(userId: string, isOnline: boolean, lat?: number, lng?: number) {
    if (isOnline) {
      const profile = await prisma.mechanicProfile.findUnique({
        where: { userId },
        select: { verificationStatus: true, serviceCategories: true },
      });
      if (!profile || profile.verificationStatus !== "APPROVED") {
        throw ApiError.forbidden("Your mechanic profile must be approved before going online");
      }
      if (profile.serviceCategories.length === 0) {
        throw ApiError.badRequest("Select at least one service category before going online");
      }
      if (lat === undefined || lng === undefined) {
        throw ApiError.badRequest("A current location is required to go online");
      }
    }

    return prisma.mechanicProfile.update({
      where: { userId },
      data: {
        isOnline,
        ...(lat !== undefined && lng !== undefined
          ? { currentLat: lat, currentLng: lng, lastLocationUpdate: new Date() }
          : {}),
      },
    });
  },

  async submitVerificationDocs(
    userId: string,
    docs: { licenseDocUrl?: string; vehicleDocUrl?: string; insuranceDocUrl?: string; licenseNumber?: string }
  ) {
    return prisma.mechanicProfile.update({
      where: { userId },
      data: { ...docs, verificationStatus: "PENDING" },
    });
  },

  async listNearby(lat: number, lng: number, category?: ServiceCategory) {
    const radiusKm = 10;
    const latitudeDelta = radiusKm / 110.574;
    const longitudeDelta = radiusKm / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    const candidates = await prisma.mechanicProfile.findMany({
      where: {
        isOnline: true,
        verificationStatus: "APPROVED",
        currentLat: { gte: Math.max(-90, lat - latitudeDelta), lte: Math.min(90, lat + latitudeDelta) },
        currentLng: { gte: Math.max(-180, lng - longitudeDelta), lte: Math.min(180, lng + longitudeDelta) },
        lastLocationUpdate: { gte: new Date(Date.now() - 2 * 60 * 1000) },
        ...(category && { serviceCategories: { has: category } }),
      },
      select: {
        id: true,
        rating: true,
        currentLat: true,
        currentLng: true,
        serviceCategories: true,
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return candidates
      .map((mechanic) => {
        const distanceKm = haversineDistanceKm(lat, lng, mechanic.currentLat!, mechanic.currentLng!);
        return {
          id: mechanic.id,
          rating: mechanic.rating,
          serviceCategories: mechanic.serviceCategories,
          user: mechanic.user,
          distanceKm: Number(distanceKm.toFixed(2)),
          approximateLat: Number(mechanic.currentLat!.toFixed(2)),
          approximateLng: Number(mechanic.currentLng!.toFixed(2)),
        };
      })
      .filter((mechanic) => mechanic.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },
};

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lng2 - lng1);
  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
