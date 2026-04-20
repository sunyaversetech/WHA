"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";

import { useParams, useRouter } from "next/navigation";

export default function AuthSelectionPage() {
  const router = useRouter();
  return (
    <div className="flex h-screen flex-col pt-22  xl:flex-row bg-white">
      {/* Left Panel */}
      <div className="w-full xl:w-1/2 flex flex-col justify-between px-8 py-6 ">
        <div>
          {/* Back Button */}
          <Button
            variant={"ghost"}
            className="p-0"
            onClick={() => router.back()}
          >
            <ChevronLeft
              className="h-9 w-9 cursor-pointer rounded-full border  p-1.5 
                 text-primary bg-white "
            />{" "}
          </Button>

          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-semibold text-gray-900">
              Sign up/log in
            </h1>
          </div>

          {/* Cards */}
          <div className="space-y-4 max-w-lg mx-auto">
            <button className="w-full border border-gray-300 rounded-xl px-6 py-5 flex items-center justify-between bg-white hover:shadow-md transition">
              <div className="text-left">
                <h2 className="text-lg font-medium text-gray-900">
                  WHA for customers
                </h2>
                <p className="text-sm text-gray-500">
                  Discover local events and deals near you
                </p>
              </div>
            </button>

            <button className="w-full border border-gray-300 rounded-xl px-6 py-5 flex items-center justify-between bg-white hover:shadow-md transition">
              <div className="text-left">
                <h2 className="text-lg font-medium text-gray-900">
                  WHA for businesses
                </h2>
                <p className="text-sm text-gray-500">
                  Promote and grow your business
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="hidden xl:block xl:fixed xl:top-24 xl:right-0 xl:bottom-10 xl:w-1/2 px-4">
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          <Image
            src="/wha/wha-auth.png"
            alt="Australia community"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
