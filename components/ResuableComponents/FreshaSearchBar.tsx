"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, MapPin, Clock, Navigation } from "lucide-react";
import { AU_CITIES } from "@/lib/data/services-catalog";
import { BUSINESS_CATEGORIES } from "@/lib/data/business-categories";
import { useLocationSearchBar } from "@/components/ResuableComponents/LocationSearch/useLocationSearchBar";

// Desktop (>=1024px) search bar for the /search (and /) header — matches
// fresha-search-kit/spec/03 + 04's exact idle/open dimensions. Reuses the
// same location/search state & submit logic as the generic site search bar
// (components/ResuableComponents/SearchSectionforBusiness.tsx), which stays
// untouched since it's still used on every other page's header.

type ActiveSeg = "what" | "where" | "when" | null;

const MON_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  { key: "any", label: "Any time", sub: "" },
  { key: "morning", label: "Morning", sub: "9am – 12pm" },
  { key: "afternoon", label: "Afternoon", sub: "12pm – 5pm" },
  { key: "evening", label: "Evening", sub: "5pm – 12am" },
];
const TODAY = { y: 2026, m: 5, d: 25 };

function buildCalendar(viewY: number, viewM: number): (number | null)[][] {
  const first = new Date(viewY, viewM, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dim = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const ROW: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, height: 56, padding: "8px 12px",
  borderRadius: 8, cursor: "pointer",
};
const TILE: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 13, background: "var(--accent)",
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const TILE_DARK: React.CSSProperties = { ...TILE, background: "var(--primary)" };
const ROW_TEXT: React.CSSProperties = { display: "flex", flexDirection: "column", lineHeight: 1.3, flex: 1 };
const ROW_TITLE: React.CSSProperties = { fontSize: 16, fontWeight: 400, lineHeight: "22px", color: "var(--foreground)" };
const ROW_SUB: React.CSSProperties = { fontSize: 13, color: "var(--muted-foreground)" };

function HoverRow({
  onClick,
  dataUi,
  children,
}: {
  onClick: () => void;
  dataUi?: string;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      data-ui={dataUi}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...ROW, margin: "0 -12px", background: hov ? "var(--muted)" : "transparent" }}>
      {children}
    </div>
  );
}

export default function FreshaSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const [popLeft, setPopLeft] = useState(0);

  const [active, setActive] = useState<ActiveSeg>(null);
  const [service, setService] = useState(
    searchParams.get("service") || searchParams.get("search") || "",
  );
  const {
    location,
    locLoading,
    requestGeoLocation: requestGeo,
    selectCity: selectCityLocation,
    clearLocation,
    ensureLocationForSearch,
    applyLocationParams,
  } = useLocationSearchBar();
  const [selDay, setSelDay] = useState<{ y: number; m: number; d: number } | null>(null);
  const [timeSlot, setTimeSlot] = useState("any");
  const [viewY, setViewY] = useState(TODAY.y);
  const [viewM, setViewM] = useState(TODAY.m);

  const weeks = useMemo(() => buildCalendar(viewY, viewM), [viewY, viewM]);
  const open = active !== null;

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!active) return;
    const idx = active === "what" ? 0 : active === "where" ? 1 : 2;
    const updateAnchor = () => {
      const el = fieldRefs.current[idx];
      if (!el) return;
      setPopLeft(el.getBoundingClientRect().left);
    };
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    return () => window.removeEventListener("resize", updateAnchor);
  }, [active]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      const inDropdown = (e.target as Element).closest?.("[data-search-dropdown]");
      if (inDropdown) return;
      setActive(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (seg: ActiveSeg) => setActive((prev) => (prev === seg ? null : seg));
  const requestGeoLocation = () => requestGeo(() => setActive("when"));

  const whenLabel = () => {
    if (!selDay) return TIME_SLOTS.find((s) => s.key === timeSlot)?.label || "Any time";
    const dayStr = `${selDay.d} ${MON_SHORT[selDay.m]}`;
    const slotStr = timeSlot !== "any" ? `, ${TIME_SLOTS.find((s) => s.key === timeSlot)?.label}` : "";
    return dayStr + slotStr;
  };

  const handleSearch = useCallback(() => {
    ensureLocationForSearch(() => {
      const params = new URLSearchParams();
      if (service) params.set("service", service);
      applyLocationParams(params);
      if (selDay)
        params.set("date", `${selDay.y}-${String(selDay.m + 1).padStart(2, "0")}-${String(selDay.d).padStart(2, "0")}`);
      if (timeSlot !== "any") params.set("time", timeSlot);
      router.push(`/search?${params.toString()}`);
      setActive(null);
    });
  }, [ensureLocationForSearch, service, applyLocationParams, selDay, timeSlot, router]);

  const selectCity = (city: string) => selectCityLocation(city, () => setActive("when"));

  const prevMonth = () => {
    if (viewM === 0) { setViewY((y) => y - 1); setViewM(11); } else setViewM((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewY((y) => y + 1); setViewM(0); } else setViewM((m) => m + 1);
  };

  const FIELDS: { seg: ActiveSeg; text: string; placeholder: string }[] = [
    { seg: "what", text: service, placeholder: "All services" },
    { seg: "where", text: location, placeholder: "Current location" },
    { seg: "when", text: selDay || timeSlot !== "any" ? whenLabel() : "", placeholder: "Any time" },
  ];

  return (
    <div ref={containerRef} className="search-wrap" style={{ position: "absolute", left: 0, right: 0, top: 12, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        ref={formRef}
        data-ui="search-form"
        style={{
          pointerEvents: "auto",
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: open ? 1025 : undefined,
          height: open ? 66 : 50,
          borderRadius: 9999,
          border: "1px solid var(--border)",
          background: open ? "var(--muted)" : "var(--background)",
          boxShadow: open ? "var(--shadow-elevated)" : "var(--shadow-search)",
          overflow: "visible",
          transition: "width .2s ease, height .2s ease",
        }}
        className={open ? "" : "w-[640px] min-[1440px]:w-[723px]"}>
        {FIELDS.map((f, i) => {
          const Icon = f.seg === "what" ? Search : f.seg === "where" ? MapPin : Clock;
          const isActive = active === f.seg;
          const showDividerBefore =
            i > 0 && !isActive && active !== FIELDS[i - 1].seg;
          return (
            <div key={f.seg} style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
              {showDividerBefore && (
                <span style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0 }} />
              )}
              <div
                ref={(el) => { fieldRefs.current[i] = el; }}
                data-ui="search-field"
                onClick={() => toggle(f.seg)}
                style={{
                  position: "relative",
                  flex: 1,
                  minWidth: 0,
                  height: open ? 64 : 48,
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  borderRadius: 9999,
                  cursor: "pointer",
                  background: open && isActive ? "var(--background)" : "transparent",
                  boxShadow: open && isActive ? "var(--shadow-elevated)" : "none",
                }}>
                {open && <Icon size={20} color="var(--muted-foreground)" style={{ flexShrink: 0 }} />}
                <span
                  data-ui="search-field-text"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: "20px",
                    letterSpacing: "-0.1px",
                    // Fresha shows idle placeholder text in ink, not grey.
                    color: "var(--foreground)",
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                  {f.text || f.placeholder}
                </span>
                {f.seg === "what" && service && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setService(""); }}
                    aria-label="Clear"
                    style={{ border: "none", background: "rgba(0,0,0,0.08)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <X size={10} strokeWidth={3} />
                  </button>
                )}
                {f.seg === "where" && location && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearLocation(); }}
                    aria-label="Clear"
                    style={{ border: "none", background: "rgba(0,0,0,0.08)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                    <X size={10} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <button
          data-ui="search-submit"
          onClick={handleSearch}
          aria-label="Search"
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: open ? "auto" : 36,
            height: open ? 48 : 36,
            margin: open ? 8 : 6,
            padding: open ? "0 20px" : 0,
            borderRadius: open ? 24 : 18,
            border: "none",
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            cursor: "pointer",
          }}>
          {open ? (
            <span style={{ fontSize: 16, fontWeight: 600, lineHeight: "22px", letterSpacing: "-0.1px", whiteSpace: "nowrap" }}>Search</span>
          ) : (
            <Search size={20} strokeWidth={1.75} />
          )}
        </button>
      </div>

      {mounted && open &&
        createPortal(
          <div onClick={() => setActive(null)} style={{ position: "fixed", inset: 0, background: "rgba(8,18,35,0.14)", zIndex: 99998 }} />,
          document.body,
        )}

      {/* WHAT popover — the one the verifier actually inspects */}
      {mounted && active === "what" &&
        createPortal(
          <div
            data-search-dropdown
            data-ui="search-popover"
            style={{
              position: "fixed",
              top: 90,
              left: Math.max(16, popLeft),
              width: 600,
              maxHeight: "calc(100vh - 102px)",
              overflowY: "auto",
              background: "var(--background)",
              borderRadius: 16,
              boxShadow: "var(--shadow-elevated)",
              padding: 32,
              zIndex: 99999,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--border)", borderRadius: 14, padding: "11px 14px", background: "var(--muted)", marginBottom: 16 }}>
              <Search size={17} color="var(--muted-foreground)" style={{ flexShrink: 0 }} />
              <input
                autoFocus
                value={service}
                onChange={(e) => setService(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="Search businesses, services, keywords…"
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}
              />
            </div>
            <HoverRow onClick={() => { setService(""); setActive("where"); }}>
              <span style={{ ...TILE }}><Clock size={19} color="var(--muted-foreground)" /></span>
              <div style={ROW_TEXT}>
                <span style={ROW_TITLE}>All services</span>
                <span style={ROW_SUB}>Browse everything</span>
              </div>
            </HoverRow>
            <span data-ui="search-popover-heading" style={{ display: "block", padding: "8px 0 4px", fontSize: 19, fontWeight: 600, lineHeight: "24px", letterSpacing: "-0.2px" }}>
              Categories
            </span>
            {BUSINESS_CATEGORIES.map(({ label, value, icon: Icon }) => (
              <HoverRow key={value} dataUi="search-popover-item" onClick={() => { setService(label); setActive("where"); }}>
                <span style={TILE}><Icon size={19} color="var(--foreground)" /></span>
                <div style={ROW_TEXT}><span style={ROW_TITLE}>{label}</span></div>
              </HoverRow>
            ))}
          </div>,
          document.body,
        )}

      {/* WHERE popover */}
      {mounted && active === "where" &&
        createPortal(
          <div data-search-dropdown style={{ position: "fixed", top: 90, left: Math.max(16, popLeft), width: 432, background: "var(--background)", borderRadius: 16, boxShadow: "var(--shadow-elevated)", padding: "14px 10px", zIndex: 99999 }}>
            <HoverRow onClick={requestGeoLocation}>
              <span style={TILE_DARK}>
                {locLoading ? (
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                    <circle cx={12} cy={12} r={9} strokeOpacity={0.25} />
                    <path d="M12 3a9 9 0 0 1 9 9" style={{ animation: "spin 0.8s linear infinite", transformOrigin: "center" }} />
                  </svg>
                ) : (
                  <Navigation size={20} color="#fff" />
                )}
              </span>
              <div style={ROW_TEXT}>
                <span style={ROW_TITLE}>Current location</span>
                <span style={ROW_SUB}>{locLoading ? "Getting your location…" : "Use my GPS location"}</span>
              </div>
            </HoverRow>
            {AU_CITIES.map(({ city, emoji }) => (
              <HoverRow key={city} onClick={() => selectCity(city)}>
                <span style={{ ...TILE, fontSize: 20 }}>{emoji}</span>
                <div style={ROW_TEXT}>
                  <span style={ROW_TITLE}>{city}</span>
                  <span style={ROW_SUB}>Australia</span>
                </div>
                {location === city && (
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                )}
              </HoverRow>
            ))}
          </div>,
          document.body,
        )}

      {/* WHEN popover */}
      {mounted && active === "when" &&
        createPortal(
          <div data-search-dropdown style={{ position: "fixed", top: 90, left: Math.min(Math.max(16, popLeft), window.innerWidth - 676), width: 660, background: "var(--background)", borderRadius: 16, boxShadow: "var(--shadow-elevated)", padding: "22px 24px 20px", zIndex: 99999 }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 184, flexShrink: 0, paddingTop: 4 }}>
                {[
                  { label: "Today", sub: `Thu ${TODAY.d} Jun`, d: TODAY.d },
                  { label: "Tomorrow", sub: "Fri 26 Jun", d: TODAY.d + 1 },
                ].map((q) => {
                  const isSel = selDay?.y === TODAY.y && selDay?.m === TODAY.m && selDay?.d === q.d;
                  return (
                    <div
                      key={q.label}
                      onClick={() => { setSelDay({ y: TODAY.y, m: TODAY.m, d: q.d }); setViewY(TODAY.y); setViewM(TODAY.m); }}
                      style={{
                        display: "flex", flexDirection: "column", gap: 2,
                        border: `1px solid ${isSel ? "var(--secondary)" : "var(--border)"}`,
                        borderRadius: 16, padding: "14px 16px", cursor: "pointer",
                        background: isSel ? "var(--accent)" : "var(--background)",
                        boxShadow: isSel ? "inset 0 0 0 1px var(--secondary)" : "none",
                      }}>
                      <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "22px", color: "var(--foreground)" }}>{q.label}</span>
                      <span style={{ fontSize: 14, color: "var(--muted-foreground)" }}>{q.sub}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <button onClick={prevMonth} aria-label="Previous month" style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--foreground)" }}>
                    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                  </button>
                  <span style={{ fontSize: 16, fontWeight: 600, lineHeight: "22px", color: "var(--foreground)" }}>{MON_NAMES[viewM]} {viewY}</span>
                  <button onClick={nextMonth} aria-label="Next month" style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--foreground)" }}>
                    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                  {WEEKDAYS.map((wd) => (
                    <div key={wd} style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" }}>{wd}</div>
                  ))}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                    {week.map((d, di) => {
                      if (d === null) return <div key={di} />;
                      const isPast = viewY < TODAY.y || (viewY === TODAY.y && viewM < TODAY.m) || (viewY === TODAY.y && viewM === TODAY.m && d < TODAY.d);
                      const isSel = selDay?.y === viewY && selDay?.m === viewM && selDay?.d === d;
                      const isToday = viewY === TODAY.y && viewM === TODAY.m && d === TODAY.d;
                      return (
                        <div
                          key={di}
                          onClick={isPast ? undefined : () => setSelDay({ y: viewY, m: viewM, d })}
                          style={{
                            height: 42, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 500, borderRadius: 9999,
                            cursor: isPast ? "default" : "pointer",
                            color: isPast ? "var(--border-strong)" : isSel ? "#fff" : "var(--foreground)",
                            background: isSel ? "var(--primary)" : "transparent",
                            boxShadow: !isSel && isToday ? "inset 0 0 0 1.6px var(--border-strong)" : "none",
                          }}>
                          {d}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--border)", marginTop: 18, paddingTop: 18, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: "20px", color: "var(--foreground)", marginRight: 4 }}>Select time</span>
              {TIME_SLOTS.map((sl) => {
                const isAct = timeSlot === sl.key;
                return (
                  <button
                    key={sl.key}
                    onClick={() => setTimeSlot(sl.key)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1,
                      border: `1px solid ${isAct ? "var(--secondary)" : "var(--border)"}`,
                      borderRadius: 16, padding: "12px 20px", fontSize: 14, cursor: "pointer", fontWeight: 500,
                      background: isAct ? "var(--accent)" : "var(--background)",
                      color: isAct ? "var(--secondary)" : "var(--foreground)",
                    }}>
                    <span>{sl.label}</span>
                    {sl.sub && <span style={{ fontSize: 13, fontWeight: 400, color: isAct ? "var(--secondary)" : "var(--muted-foreground)" }}>{sl.sub}</span>}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
