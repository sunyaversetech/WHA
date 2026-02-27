"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateFavroite,
  useGetPopulatedUserFavroite,
} from "@/services/favroite.service";
import Image from "next/image";
import { Button } from "./ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function FavoritesPage() {
  const { data: favoritesData, isLoading } = useGetPopulatedUserFavroite();

  const favorites = favoritesData?.data || {
    events: [],
    services: [],
    deals: [],
  };

  if (isLoading) return <FavoritesSkeleton />;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 min-h-screen bg-slate-50/50">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          My Favorites
        </h1>
        <p className="text-slate-500">
          Manage and view all the items you`ve saved across the marketplace.
        </p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="events" className="rounded-lg font-bold">
            Events{" "}
            <Badge variant="secondary" className="ml-2 bg-white">
              {favorites.events.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-lg font-bold">
            Services{" "}
            <Badge variant="secondary" className="ml-2 bg-white">
              {favorites.services.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deals" className="rounded-lg font-bold">
            Deals{" "}
            <Badge variant="secondary" className="ml-2 bg-white">
              {favorites.deals.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          {favorites.events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.events.map((event: any) => (
                <FavoriteCard key={event._id} item={event} type="event" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Favorite Events"
              description="You haven't saved any events yet."
            />
          )}
        </TabsContent>

        <TabsContent value="services">
          {favorites.services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.services.map((service: any) => (
                <FavoriteCard key={service._id} item={service} type="service" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Favorite Services"
              description="Looking for help? Save services here."
            />
          )}
        </TabsContent>

        <TabsContent value="deals">
          {favorites.deals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.deals.map((deal: any) => (
                <FavoriteCard key={deal._id} item={deal} type="deal" />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Favorite Deals"
              description="Save the best offers to view them later."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FavoriteCard({ item, type }: { item: any; type: string }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateFavroite();
  const handleAddRemoveFavorite = () => {
    mutate(
      { item_id: item._id, item_type: "Event" },
      {
        onSuccess: (msg) => {
          console.log("msg", msg);
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["single-user-favroite"] });
        },
        onError: () => {},
      },
    );
  };
  return (
    <Card className="group overflow-hidden pt-0 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white border border-slate-100">
      <div className="relative  overflow-hidden bg-slate-200">
        <Image
          width={500}
          height={500}
          src={item.image || "/api/placeholder/400/225"}
          alt={item.title}
          style={{ height: "250px" }}
          className="w-full  object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <Badge className="bg-orange-500 p-2 border-none font-bold uppercase text-[10px]">
            {type}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-slate-800 line-clamp-1">
            {item.title}
          </h3>
          <Button
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleAddRemoveFavorite();
            }}
            variant={"outline"}
            className=" cursor-pointer">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            ) : (
              "Remove Favorite"
            )}
          </Button>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {item.description || "No description provided."}
        </p>

        <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
          <div className="flex items-center text-xs text-slate-400 font-medium gap-2">
            <MapPin size={14} className="text-slate-300" />
            {item.location || "Online / Global"}
          </div>
          {type === "event" && (
            <div className="flex items-center text-xs text-slate-400 font-medium gap-2">
              <Calendar size={14} className="text-slate-300" />
              {new Date(item.date).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-black text-[#FF6B35]">
            ${item.price || "Free"}
          </span>
          <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider">
            View Details <ArrowRight size={14} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
      <div className="bg-slate-50 p-4 rounded-full mb-4">
        <Heart className="h-10 w-10 text-slate-200" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-slate-400 text-sm mt-1">{description}</p>
    </div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-10 space-y-10">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[350px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
