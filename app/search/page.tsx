import BusinessesClientPage from "@/components/Business/BusinessPage";

export const metadata = {
  title: "Local Businesses",
  description:
    "Discover Nepali-owned local businesses near you, across Australia.",
  alternates: { canonical: "/search" },
};

export default function BusinessesPage() {
  return <BusinessesClientPage />;
}
