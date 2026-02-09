import { LatestEvents } from "./ActiveDeals";
import { CategoryHero } from "./CategoryHero";
import LocalBusinessSection from "./LocalBusiness";
import TopCarouselSection from "./TopCarousel";
import { UpcomingEvents } from "./UpcomingEvents";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <div className="space-y-0">
        <CategoryHero />

        <div className="container mx-auto px-4 -mt-8 relative z-10">
          <TopCarouselSection />
        </div>

        <div className="py-10 space-y-16">
          <UpcomingEvents />

          <LatestEvents />

          <LocalBusinessSection />
        </div>
      </div>

      <footer className="py-10 text-center text-sm text-slate-400 border-t bg-white">
        © 2026 Whats Happening Australia. All rights reserved.
      </footer>
    </main>
  );
}
