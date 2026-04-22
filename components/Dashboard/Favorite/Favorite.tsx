"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Calendar,
  MapPin,
  ArrowRight,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import EventCard from "@/components/cards/event-card";
import BusinessCard from "@/components/cards/business-card";
import DealCard from "@/components/cards/deal-card";

export default function FavoritesPage() {
  const router = useRouter();
  const { data: favoritesData, isLoading } = useGetUserFavroite();

  const favorites = favoritesData?.data || {
    events: [],
    deals: [],
    business: [],
  };

  if (isLoading) return <FavoritesSkeleton />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between md:hidden">
        <ChevronLeft
          onClick={() => router.back()}
          className="h-10 w-10 cursor-pointer rounded-full p-1 -ml-2
               text-[#ODODOD] 
               transition-all hover:scale-105 active:scale-95"
        />
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl text-secondary  font-bold tracking-tight">
            Favorites
          </h1>
          <p className="text-muted">View and manage your favorites.</p>
        </div>
      </div>

      <hr className="border-slate-200" />

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="events" className="rounded-lg font-bold">
            Events{" "}
            <Badge variant="secondary" className="ml-2 bg-white">
              {favorites.events.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deals" className="rounded-lg font-bold">
            Deals{" "}
            <Badge variant="secondary" className="ml-2 bg-white">
              {favorites.deals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="business" className="rounded-lg font-bold">
            Business{" "}
            <Badge variant="secondary" className="ml-2 bg-white">
              {favorites.business.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          {favorites.events && favorites.events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.events.map((event) => {
                if (!event) return null;
                return <EventCard key={event._id} event={event} />;
              })}
            </div>
          ) : (
            <EmptyState
              title="No Favorite Events"
              description="You haven't saved any events yet."
            />
          )}
        </TabsContent>

        <TabsContent value="deals">
          {favorites.deals && favorites.deals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.deals.map((deal) => {
                if (!deal) return null;
                return <DealCard key={deal._id} deal={deal} />;
              })}
            </div>
          ) : (
            <EmptyState
              title="No Favorite Deals"
              description="Save the best offers to view them later."
            />
          )}
        </TabsContent>
        <TabsContent value="business">
          {favorites.business && favorites.business.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.business.map((business) => {
                if (!business) return null;
                return (
                  <BusinessCard key={business._id} business={business as any} />
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Favorite Business"
              description="Save the best Business to view them later."
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
          src={
            item.image
              ? item.image
              : item.user.image
                ? item.user.image
                : "/api/placeholder/400/225"
          }
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

// interface Business {
//   _id: string;
//   name: string;
//   email: string;
//   location: string;
//   community: string;
//   business_name: string;
//   business_category: string;
//   verified: boolean;
//   image?: string;
// }

// export function BusinessCard({ data }: { data: Business }) {
//   const slug = data.business_name.toLowerCase().replace(/[^a-z0-9]/g, "");
//   return (
//     <Card className="overflow-hidden border-slate-200 transition-all hover:shadow-lg dark:border-slate-800">
//       {/* Decorative Top Accent */}
//       <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

//       <CardHeader className="p-5 pb-0">
//         <div className="flex items-start justify-between">
//           <div className="space-y-1">
//             <div className="flex items-center gap-2">
//               <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
//                 {data.business_name}
//               </h3>
//               {data.verified && (
//                 <CheckCircle2 className="h-4 w-4 text-blue-500" />
//               )}
//             </div>
//             <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
//               <Building2 className="h-3.5 w-3.5" />
//               by {data.name}
//             </p>
//           </div>
//           <Badge
//             variant={data.verified ? "secondary" : "outline"}
//             className="capitalize">
//             {data.business_category}
//           </Badge>
//         </div>
//       </CardHeader>

//       <CardContent className="p-5 pt-4 space-y-4">
//         {/* Location Section */}
//         <div className="flex items-start gap-3">
//           <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
//           <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
//             {data.location}
//           </p>
//         </div>

//         {/* Info Grid */}
//         <div className="grid grid-cols-2 gap-4 pt-2">
//           <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
//             <Mail className="h-3.5 w-3.5 text-slate-400" />
//             <span className="truncate">{data.email}</span>
//           </div>
//           <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
//             <Users className="h-3.5 w-3.5 text-slate-400" />
//             <span className="capitalize">{data.community} Community</span>
//           </div>
//         </div>

//         <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
//           <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
//             Business ID: {data._id.slice(-6)}
//           </span>
//           <Link
//             href={`/businesses/${slug}`}
//             className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all">
//             View Profile →
//           </Link>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
