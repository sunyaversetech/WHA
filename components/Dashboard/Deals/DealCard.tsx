"use client";

import Image from "next/image";
import {
  MoreVertical,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function DealCard({ deal, onEdit, onDelete }: any) {
  const today = new Date();
  const dealValidTill = new Date(deal.valid_till);
  return (
    <div className="group relative w-full max-w-sm overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:shadow-md">
      <div className="absolute right-4 top-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full bg-white/80 p-1.5 backdrop-blur-sm hover:bg-white">
            <MoreVertical className="h-5 w-5 text-slate-700" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={() => onEdit(deal)}
              className="cursor-pointer">
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(deal._id)}
              className="cursor-pointer text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative h-64 w-full">
        <Image
          src={deal.user.image}
          alt={deal.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold shadow-sm capitalize">
          {deal.deals_for}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Valid Till:{" "}
            <span className="text-slate-900 font-bold">
              {format(new Date(deal.valid_till), "eeee, dd MMMM yyyy")}
            </span>
          </p>
          <Badge
            className={`${dealValidTill < today ? "bg-red-500 hover:bg-red-500" : "bg-emerald-500 hover:bg-emerald-500"}`}>
            {dealValidTill < today ? "Expired" : "Active"}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
          <Building2 className="h-4 w-4" />
          <span>Building • {deal._id.slice(-5).toUpperCase()}</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-slate-500 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{deal.user.city ?? deal.user.business_name}</span>
        </div>

        <div className="mt-4 flex gap-2">
          <span className="rounded-md border px-3 py-1 text-xs text-slate-600">
            Family
          </span>
          <span className="rounded-md border px-3 py-1 text-xs text-slate-600">
            Garden
          </span>
        </div>
      </div>
    </div>
  );
}
