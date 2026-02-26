import React from "react";

export default function ComingSoon() {
  return (
    <div className=" h-[70vh] w-full overflow-hidden flex items-center justify-center bg-gradient-to-br">
      {/* Main Content */}
      <div className="text-center text-black z-10 px-6">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-wide mb-6">
          Coming Soon
        </h1>
        <p className="text-lg md:text-xl opacity-90 max-w-xl mx-auto">
          We’re building something amazing. Stay tuned for the big reveal.
        </p>
      </div>

      <div className="absolute bottom-0 right-0 w-64 h-64  clip-path-corner flex items-center justify-center "></div>
    </div>
  );
}
