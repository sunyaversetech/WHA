"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, Tag } from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"; // Assuming shadcn card structure
import { Button } from "@/components/ui/button";
import type { DealsGetValues } from "@/services/deal.service";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function NewDealCard({ deal }: { deal: DealsGetValues }) {
  const router = useRouter();

  const { mutate, isPending } = useCreateFavroite();
  const { data: session } = useSession();
  const { onOpen } = useAuthModal();
  const queryClient = useQueryClient();
  const handleAddRemoveFavorite = () => {
    if (!session) {
      onOpen();
      router.push("/auth");
      return;
    }
    mutate(
      { item_id: deal._id, item_type: "Deal" },
      {
        onSuccess: (msg) => {
          router.refresh();
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => {
          toast.error("Failed to add to favorites");
        },
      },
    );
  };

  const { data: userFavorites } = useGetUserFavroite();
  const isDealFavorite = userFavorites?.data?.deals?.some(
    (item: { _id: string }) => item._id.toString() === deal._id?.toString(),
  );

  return (
    <Card
      className="w-full max-w-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all p-0"
      onClick={() => router.push(`/deals/${deal._id}`)}>
      <div className="flex relative top-3 z-999 items-start justify-between gap-3">
        <h3 className="flex gap-2 text-base items-center font-bold p-2 bg-black/30 rounded-md text-gray-900 leading-snug line-clamp-1">
          <Tag size={15} /> {deal.category}
        </h3>

        <button
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            handleAddRemoveFavorite();
          }}
          className={`p-2 rounded-full transition ${
            isDealFavorite
              ? "text-red-500 bg-red-50"
              : "text-gray-400 bg-gray-100"
          }`}>
          <Heart
            className={`h-5 w-5 ${isDealFavorite ? "fill-current" : ""}`}
          />
        </button>
      </div>
      <div className="relative h-42 w-full">
        <Image
          src={deal.image || "/placeholder.svg"}
          alt="Deal Banner"
          fill
          className="object-cover"
        />
      </div>

      <div className="relative flex  right-30  justify-center -mt-15 mb-2">
        <div className="h-20 w-20 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
          <Image
            src={deal.user?.image || "/placeholder.svg"}
            alt={deal.user?.business_name || "User"}
            width={1000}
            height={1000}
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      <CardHeader className="text-center pt-0 -mt-7 ">
        <h3 className="text-xl font-bold text-gray-900">{deal.title}</h3>
        <p className="text-sm text-gray-500">{deal.category}</p>
      </CardHeader>

      <CardContent className="text-center text-sm  text-gray-600 px-6">
        <p className="line-clamp-2">{deal.description}</p>
      </CardContent>

      <CardFooter className="flex gap-2 justify-center pb-6">
        {/* <Button variant="outline" className="w-full">
          BUTTON
        </Button>
        <Button className="w-full bg-black text-white hover:bg-gray-800">
          BUTTON
        </Button> */}
      </CardFooter>
    </Card>
  );
}
