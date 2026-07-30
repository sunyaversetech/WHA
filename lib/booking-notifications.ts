import Booking from "@/server/models/Booking.model";
import { Service } from "@/server/models/Service.model";
import User from "@/server/models/Auth.model";
import Notification from "@/server/models/Notification.model";
import { sendBookingChangeEmails } from "@/lib/mail";
import logger from "@/lib/logger";

export async function notifyBookingChange(
  bookingId: string,
  change: "rescheduled" | "cancelled",
  actor: "user" | "business",
) {
  try {
    const booking: any = await Booking.findById(bookingId);
    if (!booking) return;

    const [service, user, business] = await Promise.all([
      Service.findById(booking.service_id),
      User.findById(booking.user_id),
      User.findById(booking.business_id),
    ]);
    if (!user || !business) return;

    const context = {
      userEmail: user.email,
      userName: user.name || "Valued Customer",
      businessEmail: business.email,
      businessName:
        business.business_name || business.name || "Service Provider",
      serviceName: service?.name || "Booked Service",
      bookingDate: booking.start_time.toLocaleDateString("en-AU", {
        dateStyle: "full",
      }),
      bookingTime: booking.start_time.toLocaleTimeString("en-AU", {
        timeStyle: "short",
      }),
      bookingId: booking._id.toString(),
    };

    await sendBookingChangeEmails(change, context);

    // Only the party that didn't trigger the change needs an in-app alert.
    if (actor === "user") {
      await Notification.create({
        business_id: booking.business_id,
        type: "appointment",
        title:
          change === "cancelled" ? "Booking cancelled" : "Booking rescheduled",
        body: `${context.userName} ${change} their booking for ${context.serviceName} — ${context.bookingDate} at ${context.bookingTime}`,
        related_id: booking._id,
      });
    }
  } catch (err) {
    logger.error(
      { err, bookingId, change },
      "Failed to send booking change notification",
    );
  }
}
