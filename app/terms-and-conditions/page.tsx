import type { Metadata } from "next";
import LegalLayout from "@/components/Legal/LegalLayout";

export const metadata: Metadata = {
  title: "Terms and Conditions | What’s Happening Australia",
  description:
    "The general terms and conditions governing use of the What’s Happening Australia (WHA) booking marketplace platform.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      effectiveDate="5 August 2026"
      intro="These Terms and Conditions ('Terms') govern your access to and use of whaustralia.com and any related applications and services operated by What’s Happening Australia (WHA Inc.) ('WHA', 'we', 'us', or 'our') (together, the 'Platform'). By creating an account, browsing, booking a service, or listing a business on the Platform, you agree to be bound by these Terms. If you are registering on behalf of a business, you also agree to our Terms of Service, which contain additional terms specific to bookings and marketplace transactions. If you do not agree, please do not use the Platform.">
      <h2 id="acceptance">1. Acceptance of these Terms</h2>
      <p>
        By accessing or using the Platform, you confirm that you have read,
        understood, and agree to be bound by these Terms and our Privacy
        Policy. If you are using the Platform on behalf of a business or
        other organisation, you confirm that you have authority to bind that
        organisation to these Terms.
      </p>

      <h2 id="eligibility">2. Eligibility</h2>
      <ul>
        <li>
          You must be at least 18 years old, or the age of legal majority in
          your jurisdiction, to create an account.
        </li>
        <li>
          You must have the legal capacity to enter into a binding contract.
        </li>
        <li>
          Business Partners must be lawfully authorised to operate the
          business they list, including holding any required licences,
          permits, and registrations (such as an ABN, where applicable).
        </li>
        <li>
          You may not use the Platform if you have previously been removed
          from it for violating these Terms, unless we agree otherwise in
          writing.
        </li>
      </ul>

      <h2 id="accounts">3. Accounts</h2>
      <ul>
        <li>
          You must provide accurate, current, and complete information when
          creating an account, and keep it up to date.
        </li>
        <li>
          You are responsible for maintaining the confidentiality of your
          login credentials and for all activity that occurs under your
          account.
        </li>
        <li>
          Notify us immediately at{" "}
          <a href="mailto:support@whaustralia.com">
            support@whaustralia.com
          </a>{" "}
          if you suspect unauthorised use of your account.
        </li>
        <li>
          Each person or business should maintain a single account, unless
          we approve otherwise (for example, multiple staff members of one
          Business Partner accessing one business dashboard).
        </li>
        <li>
          User accounts and Business Partner accounts are distinct account
          types with different features and obligations, as set out further
          in our Terms of Service.
        </li>
      </ul>

      <h2 id="acceptable-use">4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the Platform for any unlawful purpose or in violation of any
          applicable law or regulation;
        </li>
        <li>
          Post or transmit false, misleading, defamatory, obscene, or
          harassing content;
        </li>
        <li>
          Impersonate any person or entity, or misrepresent your affiliation
          with a person or entity;
        </li>
        <li>
          Submit fake reviews, manipulate ratings, or offer or accept
          payment or other incentives in exchange for reviews;
        </li>
        <li>
          Create fraudulent bookings, or use the Platform to circumvent
          booking, payment, or cancellation processes;
        </li>
        <li>
          Scrape, harvest, or collect information about other Users or
          Business Partners without consent;
        </li>
        <li>
          Reverse-engineer, decompile, or attempt to extract the source code
          of the Platform, except where permitted by law;
        </li>
        <li>
          Introduce viruses, malware, or other harmful code, or attempt to
          interfere with the Platform’s operation or security;
        </li>
        <li>
          Use automated systems (bots, scrapers) to access the Platform
          without our prior written consent; or
        </li>
        <li>
          List, offer, or attempt to book any service that is illegal,
          unsafe, or that we determine, in our reasonable discretion, is
          inappropriate for the Platform.
        </li>
      </ul>
      <p>
        We may investigate and take appropriate action against anyone who,
        in our sole discretion, violates this section, including removing
        content, issuing warnings, and suspending or terminating accounts.
      </p>

      <h2 id="business-listings">5. Business listings</h2>
      <p>
        Business Partners are solely responsible for the accuracy of their
        listing, including pricing, service descriptions, availability,
        operating hours, employee information, and images. WHA does not
        verify every detail of a listing and is not responsible for
        inaccuracies in Business Partner content. Business-specific
        obligations relating to bookings, cancellations, and marketplace
        fees are set out in our Terms of Service.
      </p>

      <h2 id="content-ip">6. Content and intellectual property</h2>
      <h3>6.1 Our intellectual property</h3>
      <p>
        The Platform, including its design, text, graphics, logos, and
        underlying software, is owned by or licensed to WHA and is protected
        by copyright, trademark, and other intellectual property laws. You
        may not copy, modify, distribute, or create derivative works from
        the Platform without our prior written consent.
      </p>
      <h3>6.2 Your content</h3>
      <p>
        You retain ownership of the content you submit (such as reviews,
        images, and business listings). By submitting content, you grant WHA
        a non-exclusive, worldwide, royalty-free, sublicensable licence to
        host, store, reproduce, display, and distribute that content on and
        in connection with the Platform, for as long as the content remains
        posted. You represent that you own or have the necessary rights to
        the content you submit, and that it does not infringe any
        third-party rights.
      </p>
      <h3>6.3 Reviews</h3>
      <p>
        Reviews must reflect a genuine experience with the Business Partner
        being reviewed. We may remove reviews that violate our acceptable
        use policy, but we are not obligated to monitor, verify, or remove
        every review, and we do not guarantee the accuracy of any review.
      </p>

      <h2 id="third-party-links">7. Third-party links and services</h2>
      <p>
        The Platform may link to or integrate with third-party websites and
        services (such as payment processors, maps, and social media). We
        do not control and are not responsible for the content, policies,
        or practices of any third party.
      </p>

      <h2 id="disclaimers">8. Disclaimers</h2>
      <p>
        The Platform is provided on an “as is” and “as available” basis,
        without warranties of any kind, whether express or implied,
        including implied warranties of merchantability, fitness for a
        particular purpose, and non-infringement, to the fullest extent
        permitted by law. WHA is a marketplace that connects Users and
        Business Partners — we do not provide the services listed on the
        Platform ourselves, and we do not guarantee the quality, safety,
        legality, or availability of any service booked through the
        Platform. Nothing in this section excludes, restricts, or modifies
        any consumer guarantee, right, or remedy that cannot lawfully be
        excluded under the Australian Consumer Law.
      </p>

      <h2 id="liability">9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, WHA, its officers,
        employees, and agents will not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or any
        loss of profits, revenue, data, or goodwill, arising from or
        related to your use of the Platform, any booking made through the
        Platform, or any dispute between a User and a Business Partner. Our
        total aggregate liability arising out of or relating to these Terms
        or the Platform will not exceed the greater of (a) the amount you
        paid to WHA in the twelve months before the claim arose, or (b)
        AUD $100. Where our liability cannot be excluded but can be limited
        under the Australian Consumer Law, our liability is limited, at our
        option, to resupplying the relevant service or paying the cost of
        having it resupplied.
      </p>

      <h2 id="indemnity">10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless WHA and its officers,
        employees, and agents from any claims, damages, losses, liabilities,
        and expenses (including reasonable legal fees) arising out of your
        use of the Platform, your content, your breach of these Terms, or
        your violation of any law or third-party right.
      </p>

      <h2 id="termination">11. Suspension and termination</h2>
      <p>
        We may suspend or terminate your access to the Platform at any time,
        with or without notice, if we reasonably believe you have violated
        these Terms, engaged in fraudulent or harmful conduct, or if
        required to do so by law. You may close your account at any time
        through your account settings or by contacting us. Sections of
        these Terms that by their nature should survive termination
        (including intellectual property, disclaimers, limitation of
        liability, and indemnification) will continue to apply.
      </p>

      <h2 id="changes-to-platform">12. Changes to the Platform and Terms</h2>
      <p>
        We may modify, suspend, or discontinue any part of the Platform at
        any time. We may also update these Terms from time to time; material
        changes will be notified via the Platform or by email, and continued
        use of the Platform after changes take effect constitutes acceptance
        of the updated Terms.
      </p>

      <h2 id="governing-law">13. Governing law</h2>
      <p>
        These Terms are governed by the laws of Australia. Any dispute
        arising out of or relating to these Terms or the Platform will be
        subject to the non-exclusive jurisdiction of the courts of
        Australia.
      </p>

      <h2 id="general">14. General provisions</h2>
      <ul>
        <li>
          <strong>Severability:</strong> if any provision of these Terms is
          found unenforceable, the remaining provisions will continue in
          full force and effect.
        </li>
        <li>
          <strong>No waiver:</strong> our failure to enforce any right or
          provision of these Terms is not a waiver of that right or
          provision.
        </li>
        <li>
          <strong>Assignment:</strong> you may not assign or transfer these
          Terms without our prior written consent. We may assign these Terms
          without restriction, including in connection with a merger,
          acquisition, or sale of assets.
        </li>
        <li>
          <strong>Entire agreement:</strong> these Terms, together with our
          Privacy Policy and Terms of Service, constitute the entire
          agreement between you and WHA regarding the Platform.
        </li>
      </ul>

      <h2 id="contact">15. Contact us</h2>
      <p>
        If you have questions about these Terms, contact us at{" "}
        <a href="mailto:support@whaustralia.com">support@whaustralia.com</a>.
      </p>
    </LegalLayout>
  );
}
