import { prisma } from "../../config/db";
import { ApiError } from "../../utils/errors";

export const ratingsService = {
  async create(customerId: string, requestId: string, stars: number, comment?: string) {
    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw ApiError.notFound("Service request not found");
    if (request.customerId !== customerId) throw ApiError.forbidden();
    if (!request.mechanicId) throw ApiError.badRequest("Request has no assigned mechanic");
    if (request.status !== "COMPLETED") throw ApiError.badRequest("Request is not completed yet");

    const rating = await prisma.rating.create({
      data: { requestId, customerId, mechanicId: request.mechanicId, stars, comment },
    });

    const agg = await prisma.rating.aggregate({
      where: { mechanicId: request.mechanicId },
      _avg: { stars: true },
    });

    await prisma.mechanicProfile.update({
      where: { id: request.mechanicId },
      data: { rating: agg._avg.stars ?? stars },
    });

    return rating;
  },
};
