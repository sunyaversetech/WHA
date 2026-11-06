import BusinessesClientPage from "@/components/Business/BusinessPage";

export const metadata = {
  title: "Local Businesses",
  description:
    "Discover Nepali-owned local businesses near you, across Australia.",
  // Same content now also renders at "/" (the home page) — canonicalize to
  // there instead of creating duplicate-content signals for Google.
  alternates: { canonical: "/" },
};

export default function BusinessesPage() {
  return <BusinessesClientPage />;
}
