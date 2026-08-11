import mongoose from "mongoose";
import Event from "@/server/models/Event.model";
import { TicketHold } from "@/server/models/TicketHold.model";

const HOLD_DURATION_MS = 5 * 60 * 1000;

export function getHoldDurationMs() {
  return HOLD_DURATION_MS;
}

// TTL cleans holds up eventually, but its background sweep runs on its own
// ~60s cycle — this reconciles the per-option `held` counters immediately
// wherever availability actually needs to be accurate right now.
export async function releaseExpiredHolds(
  eventId: string,
  session?: mongoose.ClientSession,
) {
  const expired = await TicketHold.find({
    event: eventId,
    expiresAt: { $lte: new Date() },
  }).session(session ?? null);

  if (!expired.length) return;

  const event = await Event.findById(eventId).session(session ?? null);
  if (event) {
    for (const hold of expired) {
      for (const item of hold.items) {
        const option = event.options?.id(item.optionId);
        if (option) {
          option.held = Math.max(0, (option.held || 0) - item.quantity);
        }
      }
    }
    await event.save({ session: session ?? undefined });
  }

  await TicketHold.deleteMany({
    _id: { $in: expired.map((h: any) => h._id) },
  }).session(session ?? null);
}

// Releases one specific hold (manual modal close, or a stale hold being
// replaced when the user re-fetches pricing with a new promo code).
export async function releaseHoldByPaymentIntent(
  paymentIntentId: string,
  session?: mongoose.ClientSession,
) {
  const hold = await TicketHold.findOne({ paymentIntentId }).session(
    session ?? null,
  );
  if (!hold) return null;

  const event = await Event.findById(hold.event).session(session ?? null);
  if (event) {
    for (const item of hold.items) {
      const option = event.options?.id(item.optionId);
      if (option) {
        option.held = Math.max(0, (option.held || 0) - item.quantity);
      }
    }
    await event.save({ session: session ?? undefined });
  }

  await TicketHold.deleteOne({ _id: hold._id }).session(session ?? null);
  return hold;
}
