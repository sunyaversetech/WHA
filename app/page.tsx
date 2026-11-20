import { Suspense } from "react";
import BusinessesClientPage from "@/components/Business/BusinessPage";
// Old marketing landing page — kept for future reference, not deleted.
// import LandingPage from "@/components/LandingPage/LandingPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Nepali Events & Businesses in Australia | What's Happening Australia",
  description:
    "Discover upcoming Nepali concerts, festivals and community events near you, plus Nepali-owned businesses and deals across Australia.",
  path: "/",
});

export default function Home() {
  return (
    <Suspense fallback={null}>
      <BusinessesClientPage />
    </Suspense>
  );
  // return <LandingPage />;
}
