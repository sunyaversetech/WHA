import PushToken from "@/server/models/PushToken.model";
import logger from "@/lib/logger";

// Expo push notifications for the mobile app. Best effort: never throws, so a push
// failure can't break the request that triggered it. Tokens Expo reports as no
// longer registered (app uninstalled / token rotated) are deleted.
// Optional EXPO_ACCESS_TOKEN: only needed if "enhanced push security" is enabled
// for the Expo project.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100; // Expo's per-request limit

export interface PushMessage {
  title: string;
  body: string;
  /** Delivered to the app with the notification, e.g. { type, related_id }. */
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  try {
    const tokens: string[] = (
      await PushToken.find({ user_id: userId }).select("token").lean<{ token: string }[]>()
    ).map((t) => t.token);
    if (!tokens.length) return;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            sound: "default",
            title: message.title,
            body: message.body,
            data: message.data ?? {},
          })),
        ),
      });
      const json = (await res.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
      if (!res.ok || !json?.data) {
        logger.error({ status: res.status, userId }, "Expo push request failed");
        continue;
      }
      const dead = batch.filter((_, j) => json.data?.[j]?.details?.error === "DeviceNotRegistered");
      if (dead.length) await PushToken.deleteMany({ token: { $in: dead } });
    }
  } catch (err) {
    logger.error({ err, userId }, "Failed to send push notification");
  }
}
