import DealsPageClient from "@/components/Deal/DealsPageClient";

export const metadata = {
  title: "Deals",
  description:
    "Find the best deals and offers from Nepali-owned businesses across Australia.",
  alternates: { canonical: "/deals" },
};

export default function DealsPage() {
  return <DealsPageClient />;
}
