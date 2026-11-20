import { Suspense } from "react";
import DealsPageClient from "@/components/Deal/DealsPageClient";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `Deals | ${SITE_NAME}`,
  description:
    "Find the best deals and offers from Nepali-owned businesses across Australia.",
  path: "/deals",
});

export default function DealsPage() {
  return (
    <Suspense fallback={null}>
      <DealsPageClient />
    </Suspense>
  );
}
