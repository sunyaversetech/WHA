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

export function DealCard({ deal, onEdit, onDelete }: any) {
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
          src={deal.image}
          alt={deal.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold shadow-sm">
          {deal.business_name}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Due on:{" "}
            <span className="text-slate-900 font-bold">
              {new Date(deal.expiryDate).toLocaleDateString()}
            </span>
          </p>
          <Badge className="bg-emerald-500 hover:bg-emerald-500">Active</Badge>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">{deal.title}</h3>
          <div className="flex items-center gap-1 text-slate-900 font-bold">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            4.84
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
          <Building2 className="h-4 w-4" />
          <span>Building • {deal._id.slice(-5).toUpperCase()}</span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-slate-500 text-sm">
          <MapPin className="h-4 w-4" />
          <span>123 Main Street, Downtown</span>
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
