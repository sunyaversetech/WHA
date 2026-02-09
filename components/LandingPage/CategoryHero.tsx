import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryHero() {
  const categories = ["Hospitality", "Events", "Retail", "Services", "Health"];

  return (
    <section className="bg-white py-12 border-b">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="ghost"
              className="rounded-full border hover:bg-red-50 hover:text-red-600">
              {cat}
            </Button>
          ))}
        </div>

        <div className="relative max-w-2xl mx-auto">
          <Input
            className="h-14 pl-12 pr-4 rounded-full shadow-lg border-gray-200"
            placeholder="Search for businesses or events in Australia..."
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-red-600 hover:bg-red-700 h-10 px-6">
            Search
          </Button>
        </div>
      </div>
    </section>
  );
}
