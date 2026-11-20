import { Suspense } from "react";
import BusinessesClientPage from "@/components/Business/BusinessPage";
import { buildMetadata } from "@/lib/seo";

// Same content now also renders at "/" (the home page) — canonicalize to
// there instead of creating duplicate-content signals for Google, and
// reuse its title/description/OG rather than the old, disagreeing copy.
export const metadata = buildMetadata({
  title: "Nepali Events & Businesses in Australia | What's Happening Australia",
  description:
    "Discover upcoming Nepali concerts, festivals and community events near you, plus Nepali-owned businesses and deals across Australia.",
  path: "/",
});

export default function BusinessesPage() {
  return (
    <Suspense fallback={null}>
      <BusinessesClientPage />
    </Suspense>
  );
}
