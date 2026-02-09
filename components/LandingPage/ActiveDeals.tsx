import { Calendar } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export function LatestEvents() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">Latest Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="flex flex-col border border-gray-100 shadow-none hover:border-red-200 transition-colors">
              <div className="h-48 bg-gray-100" />
              <CardContent className="p-5 flex-1">
                <div className="flex items-center gap-2 text-red-600 text-sm font-semibold mb-2">
                  <Calendar className="w-4 h-4" />
                  Oct 24, 2026 • 7:00 PM
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Beachfront Music Festival
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  Experience the best live music by the ocean this summer in
                  Gold Coast.
                </p>
              </CardContent>
              <div className="p-5 pt-0 border-t mt-auto flex justify-between items-center">
                <span className="font-bold text-lg">$45.00</span>
                <Button size="sm" className="bg-black">
                  Book Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
