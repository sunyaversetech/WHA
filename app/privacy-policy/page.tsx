import type { Metadata } from "next";
import LegalLayout from "@/components/Legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | What’s Happening Australia",
  description:
    "How What’s Happening Australia (WHA) collects, uses, and protects the personal information of Users and Business Partners on our booking marketplace.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      effectiveDate="5 August 2026"
      intro="What’s Happening Australia (WHA Inc.) ('WHA', 'we', 'us', or 'our') operates a booking marketplace that connects individual customers ('Users') with local businesses ('Business Partners' or 'Businesses') who list and offer bookable services, deals, and events. This Privacy Policy explains what personal information we collect from Users and Business Partners, why we collect it, how we use and share it, and the choices and rights you have. It applies to whaustralia.com, our mobile-optimised web app, and any related services (together, the 'Platform').">
      <h2 id="who-this-applies-to">1. Who this policy applies to</h2>
      <p>
        This Privacy Policy applies to everyone who uses the Platform,
        including:
      </p>
      <ul>
        <li>
          <strong>Users</strong> — individuals who browse the Platform,
          create an account, book services, redeem deals, claim event
          tickets, save favourites, or leave reviews.
        </li>
        <li>
          <strong>Business Partners</strong> — sole traders, partnerships, or
          companies that register a business profile to list services,
          manage bookings, employ staff members on the Platform, run deals or
          events, and communicate with Users.
        </li>
      </ul>
      <p>
        Where an obligation or practice applies only to one group, we say so
        explicitly (see Section 9, “Additional information for Business
        Partners”).
      </p>

      <h2 id="information-we-collect">2. Information we collect</h2>
      <h3>2.1 Information you give us directly</h3>
      <ul>
        <li>
          <strong>Account details:</strong> name, email address, password
          (stored in hashed form), phone number, profile photo, and — for
          Users — city, general location, and community preferences you
          choose to share.
        </li>
        <li>
          <strong>Business profile details:</strong> business name, category
          and service catalogue, Australian Business Number (ABN), business
          address and coordinates, operating hours, venue and portfolio
          images, employee names and schedules, and any keywords or
          descriptions you add to help customers find your business.
        </li>
        <li>
          <strong>Booking information:</strong> the service, employee or
          resource, date and time you book or are booked for, quantity,
          price, and any notes exchanged between a User and a Business about
          a booking.
        </li>
        <li>
          <strong>Payment information:</strong> when you pay for a booking,
          deal, or event ticket, your card details are collected and
          processed directly by our payment processor, Stripe. We do not
          store your full card number, expiry date, or CVC on our servers —
          we retain only a payment reference, status, and amount so we can
          reconcile your booking.
        </li>
        <li>
          <strong>Content you post:</strong> reviews, star ratings, replies
          to reviews, and any images or text you submit through the
          Platform.
        </li>
        <li>
          <strong>Communications:</strong> messages you send us for support,
          verification requests, or account recovery.
        </li>
      </ul>

      <h3>2.2 Information we collect automatically</h3>
      <ul>
        <li>
          <strong>Device and usage data:</strong> IP address, browser type,
          device identifiers, pages viewed, referring pages, and general
          usage patterns, collected via cookies and similar technologies
          (see Section 5).
        </li>
        <li>
          <strong>Location data:</strong> if you allow it, we use your
          browser’s geolocation to show nearby businesses and calculate
          distance. You can decline or revoke this permission at any time in
          your browser settings — search will still work using a city or
          suburb you type in instead.
        </li>
        <li>
          <strong>Session and authentication data:</strong> cookies that keep
          you signed in and protect your account.
        </li>
      </ul>

      <h3>2.3 Information from third parties</h3>
      <ul>
        <li>
          If you sign in or register using Google, we receive your name,
          email address, profile photo, and Google account identifier from
          Google, as permitted by your Google account settings.
        </li>
        <li>
          Our payment processor (Stripe) shares limited transaction data
          with us, such as payment status and the last four digits of a
          card, so we can confirm your booking.
        </li>
      </ul>

      <h2 id="how-we-use-information">3. How we use your information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>Create and manage your User or Business account;</li>
        <li>
          Operate the marketplace — display business listings, process
          searches, and let Users book services offered by Business
          Partners;
        </li>
        <li>
          Process payments and send booking confirmations, reminders,
          reschedule notices, and cancellation notices by email;
        </li>
        <li>
          Enable communication between a User and the Business they’ve
          booked with, strictly for the purpose of fulfilling that booking;
        </li>
        <li>
          Publish reviews and business replies so other Users can make
          informed decisions;
        </li>
        <li>
          Send account-related notices, such as email verification and
          password reset links;
        </li>
        <li>
          Send service and promotional communications where you’ve opted in
          — you can unsubscribe at any time;
        </li>
        <li>
          Personalise search results and recommendations based on your city,
          location, and past activity;
        </li>
        <li>
          Monitor, secure, and improve the Platform, including detecting
          fraud, fake bookings, and fake reviews;
        </li>
        <li>Respond to support requests and resolve disputes; and</li>
        <li>
          Comply with our legal, tax, and regulatory obligations, including
          under the Australian Privacy Act 1988 (Cth) and the Spam Act 2003
          (Cth).
        </li>
      </ul>

      <h2 id="how-we-share-information">4. How we share information</h2>
      <p>We share personal information only as described below.</p>
      <h3>4.1 With the other party to a booking</h3>
      <p>
        When a User books a Business’s service, we share the details
        necessary to fulfil that booking — for example, the User’s name,
        contact number, email, and booking notes are shared with the
        Business, and the Business’s name, address, and contact details are
        shared with the User. This is the core function of the marketplace
        and cannot be disabled while you have an active booking.
      </p>
      <h3>4.2 Publicly, on the Platform</h3>
      <p>
        Business profiles (name, category, location, images, operating
        hours, SEO description) and reviews (reviewer name, rating, comment,
        and any business reply) are visible to anyone browsing the Platform,
        including people who are not signed in.
      </p>
      <h3>4.3 With service providers who work on our behalf</h3>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Stripe</td>
            <td>Payment processing for bookings, deals, and event tickets</td>
          </tr>
          <tr>
            <td>Amazon Web Services (S3)</td>
            <td>
              Secure storage of profile photos, venue and portfolio images
            </td>
          </tr>
          <tr>
            <td>Mailtrap</td>
            <td>
              Delivery of transactional emails (confirmations, reminders,
              verification, tickets)
            </td>
          </tr>
          <tr>
            <td>Google</td>
            <td>Optional sign-in via Google OAuth</td>
          </tr>
          <tr>
            <td>MongoDB Atlas / Upstash and other infrastructure providers</td>
            <td>Database hosting, caching, and platform infrastructure</td>
          </tr>
        </tbody>
      </table>
      <p>
        These providers are only permitted to use your information to
        deliver services to us, not for their own independent purposes.
      </p>
      <h3>4.4 For legal reasons</h3>
      <p>
        We may disclose information if required by law, court order, or
        government request, or where we believe disclosure is necessary to
        protect the rights, property, or safety of WHA, our Users, Business
        Partners, or the public.
      </p>
      <h3>4.5 Business transfers</h3>
      <p>
        If WHA is involved in a merger, acquisition, or sale of assets, your
        information may be transferred as part of that transaction, subject
        to this Privacy Policy or a policy at least as protective.
      </p>
      <h3>4.6 We do not sell your personal information</h3>
      <p>
        We do not sell, rent, or trade personal information to third parties
        for their own marketing purposes.
      </p>

      <h2 id="cookies">5. Cookies and similar technologies</h2>
      <p>We use cookies and similar technologies to:</p>
      <ul>
        <li>Keep you signed in and remember your session (essential);</li>
        <li>
          Remember preferences, such as your selected city or search filters
          (functional);
        </li>
        <li>
          Understand how the Platform is used so we can improve it
          (analytics).
        </li>
      </ul>
      <p>
        You can control or delete cookies through your browser settings.
        Blocking essential cookies may prevent you from signing in or
        completing a booking.
      </p>

      <h2 id="data-retention">6. Data retention</h2>
      <p>
        We keep personal information for as long as your account is active
        and for a reasonable period afterwards to meet legal, accounting,
        dispute-resolution, and fraud-prevention obligations — for example,
        booking and payment records are typically retained for at least
        seven years to comply with Australian tax record-keeping
        requirements. When information is no longer needed, we delete or
        de-identify it.
      </p>

      <h2 id="your-rights">7. Your rights and choices</h2>
      <ul>
        <li>
          <strong>Access and correction:</strong> you can view and update
          most of your account and profile information directly from your
          dashboard settings.
        </li>
        <li>
          <strong>Deletion:</strong> you can request deletion of your
          account and associated personal information at any time. We may
          retain certain records (such as completed booking and payment
          history) where we are legally required to.
        </li>
        <li>
          <strong>Marketing preferences:</strong> you can opt out of
          promotional emails using the unsubscribe link in any marketing
          email. You’ll still receive essential transactional emails (such
          as booking confirmations) while you have an active account.
        </li>
        <li>
          <strong>Location permission:</strong> you can allow, deny, or
          revoke browser location access at any time.
        </li>
        <li>
          <strong>Complaints:</strong> if you believe we’ve mishandled your
          personal information, you can contact us using the details below,
          or lodge a complaint with the Office of the Australian Information
          Commissioner (OAIC) at oaic.gov.au.
        </li>
      </ul>

      <h2 id="security">8. How we protect your information</h2>
      <p>
        We use industry-standard safeguards, including encrypted
        connections (HTTPS), hashed passwords, access controls, and secure
        third-party infrastructure providers, to protect personal
        information against unauthorised access, alteration, disclosure, or
        destruction. No online platform can guarantee absolute security, so
        we encourage you to use a strong, unique password and to contact us
        immediately if you suspect unauthorised access to your account.
      </p>

      <h2 id="business-partners">
        9. Additional information for Business Partners
      </h2>
      <p>
        If you register a Business Partner account, you act as the
        controller of any personal information you input about your own
        customers, employees, and staff schedules within your dashboard (for
        example, employee contact details or customer notes you add
        manually). WHA processes that information on your behalf, solely to
        provide the Platform’s booking and scheduling features. You are
        responsible for ensuring you have the appropriate rights and
        permissions to input that information, and for complying with your
        own obligations under the Privacy Act 1988 (Cth) where applicable.
      </p>
      <p>
        We may verify details you provide (such as your ABN or business
        name) against publicly available registries to confirm your
        business is genuine before your listing goes live or is marked
        verified.
      </p>

      <h2 id="childrens-privacy">10. Children’s privacy</h2>
      <p>
        The Platform is not directed to, and is not intended for use by,
        children under the age of 16. We do not knowingly collect personal
        information from children. If you believe a child has provided us
        with personal information, please contact us and we will take steps
        to delete it.
      </p>

      <h2 id="international-transfers">
        11. Overseas storage and disclosure
      </h2>
      <p>
        Some of our service providers (including cloud hosting, storage, and
        payment processing) may store or process personal information on
        servers located outside Australia. Where this occurs, we take
        reasonable steps to ensure those providers protect your information
        consistently with the Australian Privacy Principles.
      </p>

      <h2 id="third-party-links">12. Third-party links</h2>
      <p>
        The Platform may contain links to Business Partner websites, social
        media pages, or other third-party sites. We are not responsible for
        the privacy practices of those third parties, and we encourage you
        to review their privacy policies before providing them with
        personal information.
      </p>

      <h2 id="changes">13. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect
        changes in our practices or for legal, operational, or regulatory
        reasons. We’ll update the “Effective date” at the top of this page
        and, where changes are material, provide additional notice (such as
        an in-app notification or email).
      </p>

      <h2 id="contact">14. Contact us</h2>
      <p>
        If you have questions about this Privacy Policy or how we handle
        your personal information, contact us at{" "}
        <a href="mailto:privacy@whaustralia.com">privacy@whaustralia.com</a>.
      </p>
    </LegalLayout>
  );
}
