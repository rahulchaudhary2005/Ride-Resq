import { prisma } from "../config/db";
import { logger } from "../utils/logger";
import { NotificationType } from "@prisma/client";

interface NotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Persists an in-app notification and (best-effort) sends a push notification
 * via Firebase Cloud Messaging if the user has a registered device token.
 * FCM is initialized lazily so local dev works without Firebase credentials.
 */
export async function notifyUser(userId: string, input: NotificationInput) {
  await prisma.notification.create({
    data: {
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data as any,
    },
  });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.fcmToken) {
      await sendPush(user.fcmToken, input.title, input.body, input.data);
    }
  } catch (err) {
    logger.warn(`Push notification failed for user ${userId}`, err);
  }
}

async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  // Lazy import so the app can boot without Firebase env vars configured.
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }

  await admin.messaging().send({
    token,
    notification: { title, body },
    data: data ? JSON.parse(JSON.stringify(data)) : undefined,
  });
}
