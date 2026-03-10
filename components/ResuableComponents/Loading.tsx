import React from "react";
import Image from "next/image";

const LoadingPage = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#051e3a]">
      {/* <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at center, #2a59b2 0%, transparent 70%)",
        }}
      /> */}

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40 animate-pulse">
          <Image
            src="/wha/logo2.png"
            alt="Company Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3771db] animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-[#3771db] animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-[#3771db] animate-bounce"></div>
          </div>
          <p className="text-[#ffffff] font-medium tracking-widest text-xs uppercase opacity-80">
            Loading Your Content
          </p>
        </div>
      </div>

      <div className="absolute bottom-10 text-white/70 text-xs font-light tracking-tighter">
        &copy; {new Date().getFullYear()} WHA
      </div>
    </div>
  );
};

export default LoadingPage;
