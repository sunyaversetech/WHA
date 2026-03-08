"use client";
import { useRouter } from "next/navigation";
import { PlusCircle, MapPin, Eye, Edit, ChevronLeft, Link } from "lucide-react";

export default function ComingSoon() {
  const router = useRouter();
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
            Booking dashboard
          </h1>
          <p className="text-muted">
            View and manage the booking offered by your business.
          </p>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* coming soon  */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 p-20 text-center">
          Booking Coming Soon
        </h2>
      </div>
    </div>
  );
}
