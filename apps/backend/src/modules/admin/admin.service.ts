import { prisma } from "../../config/db";
import { ApiError } from "../../utils/errors";
import { MechanicVerificationStatus, ServiceCategory } from "@prisma/client";

export const adminService = {
  async dashboardStats() {
    const [
      totalUsers,
      totalMechanics,
      activeRequests,
      completedToday,
      pendingVerifications,
      revenueAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.mechanicProfile.count(),
      prisma.serviceRequest.count({
        where: { status: { in: ["PENDING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] } },
      }),
      prisma.serviceRequest.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.mechanicProfile.count({ where: { verificationStatus: "PENDING" } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true, platformFee: true } }),
    ]);

    return {
      totalUsers,
      totalMechanics,
      activeRequests,
      completedToday,
      pendingVerifications,
      totalRevenue: revenueAgg._sum.amount ?? 0,
      platformEarnings: revenueAgg._sum.platformFee ?? 0,
    };
  },

  async listMechanics(status?: MechanicVerificationStatus) {
    return prisma.mechanicProfile.findMany({
      where: status ? { verificationStatus: status } : undefined,
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async setMechanicVerification(mechanicProfileId: string, status: MechanicVerificationStatus) {
    const profile = await prisma.mechanicProfile.findUnique({ where: { id: mechanicProfileId } });
    if (!profile) throw ApiError.notFound("Mechanic not found");
    return prisma.mechanicProfile.update({
      where: { id: mechanicProfileId },
      data: { verificationStatus: status },
    });
  },

  async listAllRequests(status?: string) {
    return prisma.serviceRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: { customer: true, mechanic: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  async upsertPricing(
    category: ServiceCategory,
    data: {
      baseFare: number;
      perKmRate: number;
      minFare: number;
      surgeMultiplier?: number;
    },
  ) {
    if (
      data.baseFare < 0 ||
      data.perKmRate < 0 ||
      data.minFare < 0
    ) {
      throw ApiError.badRequest(
        "Pricing values cannot be negative",
      );
    }

    if (
      data.surgeMultiplier !== undefined &&
      data.surgeMultiplier <= 0
    ) {
      throw ApiError.badRequest(
        "Surge multiplier must be greater than zero",
      );
    }

    if (
      data.minFare > data.baseFare
    ) {
      throw ApiError.badRequest(
        "Minimum fare cannot exceed base fare",
      );
    }

    return prisma.servicePricing.upsert({
      where: { category },

      create: {
        category,
        baseFare: data.baseFare,
        perKmRate: data.perKmRate,
        minFare: data.minFare,
        surgeMultiplier:
          data.surgeMultiplier ?? 1,
        pricingVersion: 1,
      },

      update: {
        baseFare: data.baseFare,
        perKmRate: data.perKmRate,
        minFare: data.minFare,
        surgeMultiplier:
          data.surgeMultiplier ?? 1,

        pricingVersion: {
          increment: 1,
        },
      },
    });
  },

  async listPricing() {
    return prisma.servicePricing.findMany();
  },

  async listSupportTickets(status?: string) {
    return prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  },
};
