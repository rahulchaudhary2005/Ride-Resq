import { prisma } from "../config/db";
import { AuthedSocket } from "../config/socket";

export async function canAccessRequest(requestId: string, socket: AuthedSocket) {
    if (!socket.userId || !socket.role) return false;

    const request = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        select: {
            customerId: true,
            mechanic: { select: { userId: true } },
        },
    });

    if (!request) return false;
    if (socket.role === "ADMIN") return true;
    if (socket.role === "CUSTOMER") return request.customerId === socket.userId;
    if (socket.role === "MECHANIC") return request.mechanic?.userId === socket.userId;
    return false;
}