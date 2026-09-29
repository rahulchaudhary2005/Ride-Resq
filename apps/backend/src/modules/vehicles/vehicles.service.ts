import { prisma } from "../../config/db";
import { ApiError } from "../../utils/errors";

export const vehiclesService = {
  async create(ownerId: string, data: any) {
    return prisma.vehicle.create({ data: { ownerId, ...data } });
  },

  async listMine(ownerId: string) {
    return prisma.vehicle.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
  },

  async remove(ownerId: string, id: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle || vehicle.ownerId !== ownerId) throw ApiError.notFound("Vehicle not found");
    await prisma.vehicle.delete({ where: { id } });
  },
};
