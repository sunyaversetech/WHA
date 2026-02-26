import React from "react";

export default function LoadingPage() {
  return (
    <div className="relative flex items-center justify-center h-screen w-full overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-red-500">
      {/* Soft Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl top-[-150px] left-[-150px]" />
      <div className="absolute w-[400px] h-[400px] bg-white opacity-10 rounded-full blur-3xl bottom-[-120px] right-[-120px]" />

      {/* Content */}
      <div className="z-10 flex flex-col items-center text-white">
        {/* Animated Spinner */}
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-white/30 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-wide">
          Loading
        </h1>

        {/* Animated Dots */}
        <div className="flex space-x-2 mt-4">
          <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-3 h-3 bg-white rounded-full animate-bounce" />
        </div>

        {/* Subtext */}
        <p className="mt-6 text-white/80 text-sm md:text-base text-center max-w-xs">
          Please wait while we prepare everything for you 🚀
        </p>
      </div>
    </div>
  );
}
