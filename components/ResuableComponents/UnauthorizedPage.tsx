"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoveLeft, LockKeyhole } from "lucide-react";

const UnauthorizedPage = () => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#051e3a]">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at center, #3771db 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6 max-w-md text-center px-6">
        <div className="relative w-24 h-24 opacity-80 mb-4">
          <Image
            src="/wha/logo2.png"
            alt="Company Logo"
            fill
            className="object-contain grayscale"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[#3771db]/10 border border-[#3771db]/20">
            <LockKeyhole className="w-10 h-10 text-[#3771db]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-4xl font-bold tracking-tight">
              401
            </h1>
            <h2 className="text-[#3771db] font-semibold uppercase tracking-widest text-sm">
              Unauthorized Access
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Sorry, you don`t have permission to view this content. Please log
              in with an authorized account or return to safety.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="group mt-4 flex items-center gap-2 px-6 py-3 bg-[#3771db] hover:bg-[#2a59b2] text-white rounded-full transition-all duration-300 shadow-lg shadow-[#3771db]/20">
          <MoveLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Go Back Home</span>
        </button>
      </div>

      <div className="absolute bottom-10 text-white/40 text-xs font-light tracking-tighter">
        &copy; {new Date().getFullYear()} WHA • Secure Portal
      </div>
    </div>
  );
};

export default UnauthorizedPage;
