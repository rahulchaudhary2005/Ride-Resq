import { prisma } from "../../config/db";
import { ApiError } from "../../utils/errors";
import { ServiceCategory } from "@prisma/client";

export const mechanicsService = {
  async getProfile(userId: string) {
    const profile = await prisma.mechanicProfile.findUnique({
      where: { userId },
      include: { user: true },
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
    // NOTE: production should use a PostGIS radius query or Redis GEO index.
    return prisma.mechanicProfile.findMany({
      where: {
        isOnline: true,
        verificationStatus: "APPROVED",
        ...(category && { serviceCategories: { has: category } }),
      },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
    });
  },
};
