import { prisma } from "../../config/db";
import { ApiError } from "../../utils/errors";

export const usersService = {
  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw ApiError.notFound("User not found");
    const { passwordHash, ...rest } = user;
    return rest;
  },

  async updateProfile(id: string, data: { fullName?: string; avatarUrl?: string; fcmToken?: string }) {
    const user = await prisma.user.update({ where: { id }, data });
    const { passwordHash, ...rest } = user;
    return rest;
  },

  async deactivate(id: string) {
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  },
};
