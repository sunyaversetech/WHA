import { Skeleton } from "@/components/ui/skeleton";

export default function LandingPageSkeleton() {
  return (
    <div style={{ background: "#ffffff", overflowX: "hidden" }} className="animate-pulse">
      {/* ── Hero ── */}
      <section
        style={{
          padding: "clamp(110px, 11vw, 140px) clamp(20px, 4vw, 56px) 70px",
          background:
            "radial-gradient(120% 120% at 50% -8%, #bad2f5 0%, #d4e7f8 16%, #e8f1fc 38%, #f4f8fd 60%, #ffffff 100%)",
        }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <Skeleton className="h-14 w-3/4 mx-auto mb-5 rounded-xl" />
          <Skeleton className="h-6 w-1/2 mx-auto mb-10 rounded-lg" />

          {/* Desktop search */}
          <div className="hidden md:flex justify-center">
            <Skeleton className="h-16 w-full max-w-4xl rounded-2xl" />
          </div>
          {/* Mobile search card */}
          <div className="md:hidden">
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>

          <Skeleton className="h-5 w-52 mx-auto mt-9 rounded-full" />
          <Skeleton className="h-11 w-36 mx-auto mt-5 rounded-full" />
        </div>
      </section>

      {/* ── Promotional banner ── */}
      <div
        style={{
          maxWidth: 1280,
          margin: "30px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <Skeleton
          className="w-full rounded-[22px] max-md:aspect-[10/5]"
          style={{ aspectRatio: "21/8" }}
        />
      </div>

      {/* ── Card sections ── */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "50px clamp(20px,4vw,56px) 0",
        }}>
        {[0, 1, 2].map((section) => (
          <section key={section} style={{ marginBottom: 54 }}>
            {/* Section heading row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 22,
              }}>
              <Skeleton className="h-8 w-56 rounded-lg" />
              <div style={{ display: "flex", gap: 10 }}>
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>

            {/* Desktop 4-col grid */}
            <div
              className="hidden md:grid"
              style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 26 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>

            {/* Mobile horizontal scroll */}
            <div className="md:hidden flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-56 rounded-2xl flex-shrink-0"
                  style={{ minWidth: 260 }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── App download ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "60px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <div
          className="wha-2col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "center",
          }}>
          <div>
            <Skeleton className="h-5 w-28 mb-6 rounded-full" />
            <Skeleton className="h-12 w-3/4 mb-4 rounded-xl" />
            <Skeleton className="h-5 w-64 mb-2 rounded" />
            <Skeleton className="h-5 w-56 mb-7 rounded" />
            <div style={{ display: "flex", gap: 14 }}>
              <Skeleton className="h-14 w-36 rounded-xl" />
              <Skeleton className="h-14 w-36 rounded-xl" />
            </div>
          </div>

          {/* Phone mockups */}
          <div className="wha-phones" style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            <Skeleton className="rounded-[36px] flex-shrink-0" style={{ width: 240, height: 480 }} />
            <Skeleton className="rounded-[36px] flex-shrink-0 mt-[46px]" style={{ width: 240, height: 480 }} />
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section
        style={{
          maxWidth: 1180,
          margin: "90px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <div
          className="wha-3col"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ background: "#f6f8fb", borderRadius: 20, padding: "30px 28px" }}>
              <Skeleton className="h-5 w-28 mb-4 rounded-full" />
              <Skeleton className="h-6 w-3/4 mb-3 rounded" />
              <Skeleton className="h-4 w-full mb-2 rounded" />
              <Skeleton className="h-4 w-5/6 mb-2 rounded" />
              <Skeleton className="h-4 w-4/6 mb-7 rounded" />
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
                <div>
                  <Skeleton className="h-4 w-20 mb-2 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "96px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
          textAlign: "center",
        }}>
        <Skeleton className="h-9 w-80 mx-auto mb-3 rounded-lg" />
        <Skeleton className="h-5 w-64 mx-auto mb-14 rounded" />
        <div
          className="wha-stats"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="h-11 w-32 mx-auto mb-3 rounded-lg" />
              <Skeleton className="h-4 w-36 mx-auto rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* ── WHA for Business ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "96px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <div
          className="wha-2col"
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 48,
            alignItems: "center",
          }}>
          <div>
            <Skeleton className="h-11 w-3/4 mb-4 rounded-xl" />
            <Skeleton className="h-5 w-full mb-2 rounded" />
            <Skeleton className="h-5 w-5/6 mb-7 rounded" />
            <Skeleton className="h-12 w-44 rounded-full mb-10" />
            <Skeleton className="h-6 w-32 mb-3 rounded" />
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-7 w-7 rounded" />
              ))}
            </div>
            <Skeleton className="h-4 w-48 rounded" />
          </div>

          {/* Dashboard placeholder */}
          <Skeleton className="h-[400px] w-full rounded-[22px]" />
        </div>
      </section>

      {/* ── Browse by City ── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "96px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <Skeleton className="h-8 w-48 mb-7 rounded-lg" />

        {/* City chips */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 40 }}>
          {[120, 140, 130, 110, 125, 115, 130, 105].map((w, i) => (
            <Skeleton key={i} className="h-10 rounded-full" style={{ width: w }} />
          ))}
        </div>

        {/* 4-col link columns */}
        <div
          className="wha-city"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {[1, 2, 3, 4].map((col) => (
            <div key={col}>
              <Skeleton className="h-5 w-24 mb-4 rounded" />
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-4 w-full mb-3 rounded" />
              ))}
            </div>
          ))}
        </div>

        {/* Service chips */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 40,
            paddingTop: 36,
            borderTop: "1px solid #eef1f5",
          }}>
          {[130, 160, 115, 125, 105, 140, 95, 110].map((w, i) => (
            <Skeleton key={i} className="h-11 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          marginTop: 90,
          borderTop: "1px solid #eef1f5",
          padding: "54px clamp(20px,4vw,56px) 40px",
        }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div
            className="wha-foot"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
              gap: 40,
              paddingBottom: 44,
              borderBottom: "1px solid #eef1f5",
            }}>
            {/* Brand */}
            <div>
              <Skeleton className="h-7 w-16 mb-5 rounded" />
              <Skeleton className="h-4 w-full mb-2 rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>

            {[1, 2, 3].map((col) => (
              <div key={col}>
                <Skeleton className="h-5 w-28 mb-4 rounded" />
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-32 mb-3 rounded" />
                ))}
              </div>
            ))}
          </div>

          {/* Social + legal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 36,
              flexWrap: "wrap",
              gap: 20,
            }}>
            <div style={{ display: "flex", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5 w-24 rounded" />
              ))}
            </div>
            <Skeleton className="h-5 w-36 rounded" />
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav spacer */}
      <div className="md:hidden h-16" />

      <style>{`
        @media (max-width: 1000px) {
          .wha-city   { grid-template-columns: repeat(2, 1fr) !important; }
          .wha-stats  { grid-template-columns: repeat(2, 1fr) !important; }
          .wha-2col   { grid-template-columns: 1fr !important; gap: 36px !important; }
          .wha-3col   { grid-template-columns: 1fr !important; }
          .wha-foot   { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .wha-city   { grid-template-columns: 1fr !important; }
          .wha-foot   { grid-template-columns: 1fr !important; gap: 32px !important; }
          .wha-phones { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>
    </div>
  );
}
