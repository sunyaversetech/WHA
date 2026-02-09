import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Button } from "../ui/button";

export function UpcomingEvents() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold">Featured Businesses</h2>
          <Button variant="link" className="text-red-600">
            View All
          </Button>
        </div>

        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <CarouselItem
                key={i}
                className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                    <Badge className="absolute top-3 left-3 bg-white/90 text-black hover:bg-white">
                      Verified
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold">Grand Sydney Cafe</h3>
                      <div className="flex items-center text-sm font-medium">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />{" "}
                        4.9
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Sydney, NSW • Hospitality
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-end gap-2 mt-6 md:absolute md:-top-16 md:right-0">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
