import type { Metadata } from "next";
import LegalLayout from "@/components/Legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service | What’s Happening Australia",
  description:
    "The booking and marketplace terms that apply when Users book services and Business Partners list services on What’s Happening Australia (WHA).",
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      effectiveDate="5 August 2026"
      intro="These Terms of Service describe how bookings, payments, cancellations, deals, and events work on the What’s Happening Australia (WHA) marketplace. They apply in addition to, and should be read together with, our Terms and Conditions and Privacy Policy. Capitalised terms not defined here have the meaning given in our Terms and Conditions.">
      <h2 id="overview">1. What WHA is — and isn’t</h2>
      <p>
        WHA operates an online marketplace that lets Users discover and book
        services offered by independent Business Partners, and lets
        Business Partners list their services, manage bookings, and reach
        new customers. When a User books a service, a contract for that
        service is formed directly between the User and the Business
        Partner. <strong>WHA is not a party to that contract</strong>, is
        not the provider of any listed service, and does not employ,
        supervise, or control any Business Partner or its staff. WHA’s role
        is to facilitate discovery, booking, scheduling, and payment for
        that transaction.
      </p>

      <h2 id="definitions">2. Definitions</h2>
      <ul>
        <li>
          <strong>“Booking”</strong> means a reserved appointment or slot for
          a Service, made by a User through the Platform.
        </li>
        <li>
          <strong>“Service”</strong> means any bookable offering listed by a
          Business Partner, including employee-based appointments,
          resource/item-based bookings, and group sessions.
        </li>
        <li>
          <strong>“Deal”</strong> means a discounted offer or coupon listed
          by a Business Partner and redeemed via a code.
        </li>
        <li>
          <strong>“Event”</strong> means a ticketed event listed on the
          Platform, redeemable via a QR code.
        </li>
      </ul>

      <h2 id="how-booking-works">3. How booking works</h2>
      <ol>
        <li>
          A User browses Business Partner listings and selects a Service,
          time slot, and (where applicable) staff member or resource.
        </li>
        <li>
          The selected slot is temporarily held for a short period while the
          User completes checkout, so two Users cannot book the same slot at
          the same time. If checkout is not completed within that window,
          the hold expires and the slot becomes available again.
        </li>
        <li>
          The User confirms the Booking and, where the Service requires
          upfront payment, completes payment via our payment processor.
        </li>
        <li>
          Both the User and the Business Partner receive an email
          confirmation with the Booking details.
        </li>
        <li>
          The Business Partner may reassign staff, and either party may
          reschedule or cancel the Booking, subject to Section 5 below.
        </li>
      </ol>
      <p>
        Business Partners are responsible for keeping their availability,
        pricing, and service details accurate and up to date. Bookings are
        accepted subject to genuine availability; occasionally a Booking may
        need to be adjusted or cancelled by a Business Partner due to
        unforeseen circumstances, in which case Section 5 applies.
      </p>

      <h2 id="payments">4. Payments and pricing</h2>
      <ul>
        <li>
          All prices are set by the Business Partner and displayed in
          Australian Dollars (AUD) unless stated otherwise.
        </li>
        <li>
          Payments are processed securely through Stripe. By making a
          payment, you agree to Stripe’s terms of service in addition to
          ours.
        </li>
        <li>
          Depending on the Business Partner’s settings, payment may be taken
          at the time of Booking or at the time of service.
        </li>
        <li>
          Business Partners are responsible for any taxes (including GST, if
          applicable) associated with the Services they sell, and for
          accurately pricing their listings inclusive of any such taxes.
        </li>
        <li>
          Any marketplace, listing, or transaction fees payable by a
          Business Partner for using the Platform will be disclosed at
          registration or in a separate fee schedule made available to
          Business Partners, and may be updated from time to time with
          reasonable notice.
        </li>
      </ul>

      <h2 id="cancellations">5. Cancellations and rescheduling</h2>
      <h3>5.1 Cancellation policy set by the Business Partner</h3>
      <p>
        Each Service has a cancellation policy chosen by the Business
        Partner, shown at the time of Booking — for example, cancellable any
        time, cancellable up to a set number of hours before the
        appointment, or non-cancellable. Users should review the
        cancellation policy before confirming a Booking. Whether a Booking
        is eligible for a refund on cancellation depends on that policy and
        on whether the Business Partner has marked the Service as
        refundable.
      </p>
      <h3>5.2 Cancelling or rescheduling as a User</h3>
      <p>
        You can cancel or reschedule an eligible Booking from your
        dashboard, subject to the applicable cancellation policy and to the
        new time being available. Where a Booking is rescheduled or
        cancelled, both you and the Business Partner will receive an email
        notification.
      </p>
      <h3>5.3 Cancelling or rescheduling as a Business Partner</h3>
      <p>
        Business Partners may need to reschedule or cancel a Booking (for
        example, due to staff unavailability). Where a Business Partner
        cancels a paid Booking, the User is entitled to a full refund of any
        amount paid for that Booking, regardless of the Service’s
        cancellation policy. Business Partners should provide as much notice
        as reasonably possible.
      </p>
      <h3>5.4 No-shows</h3>
      <p>
        If a User does not show up for a confirmed Booking without cancelling
        in advance, the Business Partner may mark the Booking as a no-show.
        Depending on the Service’s policy, no-show Bookings may not be
        eligible for a refund. Repeated no-shows may result in restrictions
        on your ability to make future Bookings.
      </p>

      <h2 id="refunds">6. Refunds</h2>
      <p>
        Eligible refunds are processed back to the original payment method
        through Stripe and may take several business days to appear,
        depending on your bank or card issuer. WHA facilitates the refund
        process but the underlying refund decision (outside of Business
        Partner–initiated cancellations under Section 5.3) rests with the
        Business Partner’s stated cancellation and refund policy. Nothing
        in this section limits any right or remedy you have under the
        Australian Consumer Law.
      </p>

      <h2 id="business-partner-obligations">
        7. Business Partner obligations
      </h2>
      <p>As a Business Partner, you agree to:</p>
      <ul>
        <li>
          Provide accurate business information, including a valid ABN
          where required, and keep your listing, pricing, and availability
          up to date;
        </li>
        <li>
          Hold all licences, permits, insurance, and qualifications required
          by law to provide the Services you list;
        </li>
        <li>
          Honour confirmed Bookings and provide the Services you list with
          reasonable care and skill;
        </li>
        <li>
          Set a clear cancellation policy for each Service and honour
          refunds owed under Section 5.3;
        </li>
        <li>
          Respond to Booking requests, reviews, and customer enquiries in a
          timely and professional manner;
        </li>
        <li>
          Only input customer or employee information you are authorised to
          hold, in line with Section 9 of our Privacy Policy; and
        </li>
        <li>
          Not use the Platform to solicit Users to book or pay outside the
          Platform in order to avoid applicable fees.
        </li>
      </ul>
      <p>
        We may display a “verified” indicator on listings where we have
        checked certain business details. Verification is not a guarantee
        or endorsement of the quality of a Business Partner’s Services.
      </p>

      <h2 id="user-obligations">8. User obligations</h2>
      <p>As a User, you agree to:</p>
      <ul>
        <li>Provide accurate contact and payment information;</li>
        <li>
          Attend confirmed Bookings, or cancel or reschedule with reasonable
          notice in line with the applicable cancellation policy;
        </li>
        <li>
          Treat Business Partners and their staff respectfully and follow
          any reasonable venue or service policies communicated to you; and
        </li>
        <li>
          Leave reviews that reflect your genuine experience, in line with
          our Terms and Conditions.
        </li>
      </ul>

      <h2 id="reviews-disputes">9. Reviews and disputes between Users and Business Partners</h2>
      <p>
        After a Booking, Users may leave a public review, and Business
        Partners may reply publicly. Because WHA is not a party to the
        underlying service contract, disputes about the quality, delivery,
        or outcome of a Service (as opposed to a Platform payment or
        Booking-mechanics issue) are between the User and the Business
        Partner. We may, at our discretion, assist in facilitating a
        resolution, but we are not obligated to mediate, arbitrate, or
        determine the outcome of such disputes.
      </p>

      <h2 id="deals-events">10. Deals and event tickets</h2>
      <ul>
        <li>
          Deals are redeemed using a unique code issued at the time of
          purchase, subject to any redemption limits, expiry dates, or
          conditions set by the Business Partner.
        </li>
        <li>
          Event tickets are issued as a unique QR code per ticket and must
          be presented at the event for verification. Each code is valid
          for one entry only and may not be duplicated, resold, or
          transferred except where the Business Partner or event organiser
          permits it.
        </li>
        <li>
          Deals and event tickets are provided by the listing Business
          Partner or event organiser, and are subject to that party’s own
          terms, refund policy, and availability.
        </li>
      </ul>

      <h2 id="prohibited-booking-conduct">
        11. Prohibited booking conduct
      </h2>
      <p>In addition to the acceptable use rules in our Terms and Conditions, you must not:</p>
      <ul>
        <li>
          Create fake or fraudulent Bookings, including to inflate a
          Business Partner’s activity or ranking;
        </li>
        <li>
          Make a payment with a card or account you are not authorised to
          use;
        </li>
        <li>
          Dispute or “charge back” a legitimate payment with your bank
          instead of first attempting to resolve the matter with the
          Business Partner or WHA; or
        </li>
        <li>
          Circumvent the Platform’s slot-locking or availability system to
          reserve Services you do not intend to attend or pay for.
        </li>
      </ul>
      <p>
        Violation of this section may result in suspension of your Booking
        privileges or account, and may be reported to the relevant Business
        Partner or, where appropriate, law enforcement.
      </p>

      <h2 id="liability">12. Liability for booked services</h2>
      <p>
        To the fullest extent permitted by law, WHA is not liable for any
        act, omission, injury, loss, or damage arising from a Service
        provided (or not provided) by a Business Partner, including the
        quality, safety, or legality of that Service. This section does not
        limit any right or remedy you have directly against the Business
        Partner, or any consumer guarantee that cannot lawfully be excluded
        under the Australian Consumer Law. Our general limitation of
        liability in the Terms and Conditions also applies to these Terms
        of Service.
      </p>

      <h2 id="changes">13. Changes to these Terms of Service</h2>
      <p>
        We may update these Terms of Service from time to time, for example
        to reflect new booking features or marketplace policies. We’ll
        update the effective date above and, for material changes, provide
        additional notice through the Platform or by email.
      </p>

      <h2 id="contact">14. Contact us</h2>
      <p>
        Questions about a specific Booking should first be directed to the
        relevant Business Partner. For questions about these Terms of
        Service, contact us at{" "}
        <a href="mailto:support@whaustralia.com">support@whaustralia.com</a>.
      </p>
    </LegalLayout>
  );
}
