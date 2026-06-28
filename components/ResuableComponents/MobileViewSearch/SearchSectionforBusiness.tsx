"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, MapPin, Clock, ChevronLeft, Navigation, Calendar } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  SERVICE_CATEGORIES,
  AU_CITIES,
  searchServices,
  type ServiceItem,
} from "@/lib/data/services-catalog";

/* ── types ── */
type Step = "what" | "where" | "when";
const STEPS: Step[] = ["what", "where", "when"];

/* ── calendar helpers (same as desktop) ── */
const MON_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const TIME_SLOTS = [
  { key: "any",       label: "Any time",   sub: ""           },
  { key: "morning",   label: "Morning",    sub: "9am – 12pm" },
  { key: "afternoon", label: "Afternoon",  sub: "12pm – 5pm" },
  { key: "evening",   label: "Evening",    sub: "5pm – 12am" },
];
const TODAY = { y: 2026, m: 5, d: 25 };

function buildCalendar(viewY: number, viewM: number): (number | null)[][] {
  const first    = new Date(viewY, viewM, 1);
  const startDow = (first.getDay() + 6) % 7;
  const dim      = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/* ── shared style constants ── */
const TILE: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 13,
  background: "#eaf0fb", display: "flex", alignItems: "center",
  justifyContent: "center", flexShrink: 0,
};
const TILE_DARK: React.CSSProperties = { ...TILE, background: "#051e3a" };
const ROW_TEXT: React.CSSProperties  = { display: "flex", flexDirection: "column", lineHeight: 1.3, flex: 1 };
const ROW_TITLE: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: "#1e293b" };
const ROW_SUB: React.CSSProperties   = { fontSize: 13, color: "#7c899c" };

const SLIDE = {
  initial:    { opacity: 0, x: 28 },
  animate:    { opacity: 1, x: 0  },
  exit:       { opacity: 0, x: -28 },
  transition: { type: "spring" as const, stiffness: 380, damping: 30 },
};

/* ── row component ── */
function TRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 14, cursor: "pointer", background: hov ? "#f4f7fb" : "transparent" }}
    >
      {children}
    </div>
  );
}

/* ── step pill indicator ── */
function StepDots({ step }: { step: Step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0" }}>
      {STEPS.map(s => {
        const done    = STEPS.indexOf(s) < STEPS.indexOf(step);
        const current = s === step;
        return (
          <div
            key={s}
            style={{
              height: 6, borderRadius: 9999, transition: "all 0.3s",
              width: current ? 24 : 6,
              background: current ? "#051e3a" : done ? "#3771db" : "#e6ebf2",
            }}
          />
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function MobileBusinessSearchWithDates({
  variant = "pill",
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  variant?: "pill" | "card";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = externalOpen !== undefined;
  const open    = controlled ? externalOpen! : internalOpen;
  const setOpen = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(open) : v;
    if (controlled) externalOnOpenChange?.(next);
    else setInternalOpen(next);
  };
  const [step, setStep]             = useState<Step>("what");
  const [service, setService]       = useState(searchParams.get("service") || searchParams.get("search") || "");
  const [serviceQuery, setServiceQuery] = useState(service);
  const [location, setLocation]     = useState(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return "Current location";
    return searchParams.get("city") || "";
  });
  const [geoCoords, setGeoCoords]   = useState<{ lat: number; lng: number } | null>(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return { lat: Number(lat), lng: Number(lng) };
    return null;
  });
  const [locLoading, setLocLoading] = useState(false);
  const [selDay, setSelDay]         = useState<{ y: number; m: number; d: number } | null>(null);
  const [timeSlot, setTimeSlot]     = useState("any");
  const [viewY, setViewY]           = useState(TODAY.y);
  const [viewM, setViewM]           = useState(TODAY.m);
  const [whatTab, setWhatTab]       = useState<"all" | "services">("all");

  const suggestions = useMemo(() => searchServices(serviceQuery), [serviceQuery]);
  const weeks       = useMemo(() => buildCalendar(viewY, viewM), [viewY, viewM]);

  const whenLabel = () => {
    if (!selDay) return TIME_SLOTS.find(s => s.key === timeSlot)?.label || "Any time";
    return `${selDay.d} ${MON_SHORT[selDay.m]}${timeSlot !== "any" ? `, ${TIME_SLOTS.find(s => s.key === timeSlot)?.label}` : ""}`;
  };

  const triggerSummary = [service, location, selDay ? whenLabel() : ""].filter(Boolean).join(" · ") || "Search for a service...";

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
    else setOpen(false);
  };

  const handleOpen = () => { setStep("what"); setOpen(true); };

  const selectService = (item: ServiceItem) => {
    setService(item.name);
    setServiceQuery(item.name);
    setStep("where");
  };

  const requestGeoLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation("Current location");
        setLocLoading(false);
        setStep("when");
      },
      () => setLocLoading(false),
      { timeout: 8000 },
    );
  };

  const selectCity = (city: string) => {
    setGeoCoords(null);
    setLocation(city);
    setStep("when");
  };

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (service) params.set("service", service);
    if (geoCoords) {
      params.set("lat", String(geoCoords.lat));
      params.set("lng", String(geoCoords.lng));
    } else if (location) {
      params.set("city", location);
    }
    if (selDay) params.set("date", `${selDay.y}-${String(selDay.m + 1).padStart(2, "0")}-${String(selDay.d).padStart(2, "0")}`);
    if (timeSlot !== "any") params.set("time", timeSlot);
    router.push(`/businesses?${params.toString()}`);
    setOpen(false);
  }, [service, location, geoCoords, selDay, timeSlot, router]);

  const prevMonth = () => { if (viewM === 0) { setViewY(y => y - 1); setViewM(11); } else setViewM(m => m - 1); };
  const nextMonth = () => { if (viewM === 11) { setViewY(y => y + 1); setViewM(0); } else setViewM(m => m + 1); };

  /* ── step header label ── */
  const stepLabel = { what: "What service?", where: "Where?", when: "When?" }[step];
  const stepIcon  = { what: <Search size={18} color="#64748b" />, where: <MapPin size={18} color="#64748b" />, when: <Clock size={18} color="#64748b" /> }[step];
  const stepVal   = { what: serviceQuery, where: location, when: selDay ? whenLabel() : "" }[step];

  return (
    <Drawer open={open} onOpenChange={setOpen}>

      {/* ── Trigger (hidden in controlled/headless mode) ── */}
      {!controlled && (variant === "card" ? (
        /* Fresha-style stacked card */
        <div style={{ padding: "0 20px" }}>
          <div style={{
            background: "linear-gradient(135deg, #c4b5fd 0%, #f9a8d4 100%)",
            borderRadius: 23,
            padding: 1.5,
          }}>
            <div style={{ background: "#fff", borderRadius: 22, overflow: "hidden" }}>

              {/* Treatment row */}
              <div
                onClick={() => { setStep("what"); setOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderBottom: "1px solid #f1f4f8", cursor: "pointer" }}
              >
                <Search size={20} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 16, color: service ? "#1e293b" : "#64748b" }}>
                  {service || "All treatments"}
                </span>
              </div>

              {/* Location row */}
              <div
                onClick={() => { setStep("where"); setOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderBottom: "1px solid #f1f4f8", cursor: "pointer" }}
              >
                <MapPin size={20} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 16, color: location ? "#1e293b" : "#64748b" }}>
                  {location || "Current location"}
                </span>
              </div>

              {/* Date/time row */}
              <div
                onClick={() => { setStep("when"); setOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", cursor: "pointer" }}
              >
                <Calendar size={20} color="#64748b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 16, color: selDay ? "#1e293b" : "#64748b" }}>
                  {selDay ? whenLabel() : "Any time"}
                </span>
              </div>

              {/* Search button */}
              <div style={{ padding: "4px 16px 16px" }}>
                <button
                  onClick={handleSearch}
                  style={{ width: "100%", background: "#051e3a", color: "#fff", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
                >
                  Search WHA
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Pill (used in navbar) */
        <DrawerTrigger asChild>
          <div
            onClick={handleOpen}
            style={{
              margin: "10px 16px 8px",
              display: "flex", alignItems: "center", gap: 12,
              background: "#f1f4f8", border: "1px solid #e6ebf2",
              borderRadius: 9999, padding: "13px 18px",
              cursor: "pointer", boxShadow: "0 4px 16px rgba(2,12,26,0.06)",
            }}
          >
            <Search size={18} color="#3771db" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: service || location ? "#1e293b" : "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {triggerSummary}
            </span>
            {(service || location || selDay) && (
              <button
                onClick={e => { e.stopPropagation(); setService(""); setServiceQuery(""); setLocation(""); setSelDay(null); setTimeSlot("any"); }}
                style={{ border: "none", background: "rgba(0,0,0,0.08)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                <X size={11} strokeWidth={3} />
              </button>
            )}
          </div>
        </DrawerTrigger>
      ))}

      {/* ── Full-screen drawer ── */}
      <DrawerContent style={{ height: "100dvh", background: "#fff", display: "flex", flexDirection: "column", borderRadius: 0, border: "none" }}>
        <DrawerTitle style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
          Find a service
        </DrawerTitle>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 12px", borderBottom: "1px solid #f1f4f8" }}>
          <button
            onClick={goBack}
            aria-label="Back"
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#f1f4f8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <ChevronLeft size={20} color="#0f2748" />
          </button>

          {/* Active segment display */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#f1f4f8", border: "1px solid #e6ebf2", borderRadius: 9999, padding: "11px 16px" }}>
            {stepIcon}
            {step === "what" ? (
              <input
                type="text"
                autoFocus
                value={serviceQuery}
                onChange={e => { setServiceQuery(e.target.value); setService(e.target.value); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder={stepLabel}
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: "#1e293b", flex: 1, padding: 0 }}
              />
            ) : (
              <span style={{ fontSize: 15, fontWeight: 600, color: stepVal ? "#1e293b" : "#94a3b8", flex: 1 }}>
                {stepVal || stepLabel}
              </span>
            )}
            {stepVal && (
              <button
                onClick={() => {
                  if (step === "what") { setService(""); setServiceQuery(""); }
                  else if (step === "where") setLocation("");
                  else { setSelDay(null); setTimeSlot("any"); }
                }}
                style={{ border: "none", background: "rgba(0,0,0,0.08)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                <X size={10} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Step dots */}
        <StepDots step={step} />

        {/* ── Step panels ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 0" }}>
          <AnimatePresence mode="wait">

            {/* WHAT */}
            {step === "what" && (
              <motion.div key="what" {...SLIDE}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 8, padding: "12px 16px 16px", flexWrap: "wrap" }}>
                  {(["all", "services"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setWhatTab(tab)}
                      style={{ border: "1px solid", borderColor: whatTab === tab ? "#051e3a" : "#e6ebf2", borderRadius: 9999, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: whatTab === tab ? "#051e3a" : "#fff", color: whatTab === tab ? "#fff" : "#334155" }}
                    >
                      {tab === "all" ? "All" : "Services"}
                    </button>
                  ))}
                </div>

                {suggestions.length > 0 ? (
                  /* Autocomplete */
                  <div style={{ padding: "0 8px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0f2748", padding: "0 12px 8px" }}>Suggestions</div>
                    {suggestions.map(s => (
                      <TRow key={s.slug} onClick={() => selectService(s)}>
                        <span style={{ ...TILE, fontSize: 22 }}>{s.emoji}</span>
                        <div style={ROW_TEXT}><span style={ROW_TITLE}>{s.name}</span></div>
                      </TRow>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Recents */}
                    <div style={{ padding: "0 8px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 8px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#0f2748" }}>Recents</span>
                      </div>
                      <TRow onClick={() => { setService(""); setServiceQuery(""); setStep("where"); }}>
                        <span style={{ ...TILE, background: "#f1f4f9" }}><Clock size={20} color="#64748b" /></span>
                        <div style={ROW_TEXT}>
                          <span style={ROW_TITLE}>All services</span>
                          <span style={ROW_SUB}>Any time</span>
                        </div>
                      </TRow>
                    </div>

                    {/* Services grid */}
                    <div style={{ padding: "0 8px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#0f2748", padding: "4px 12px 8px" }}>Services</div>
                      {SERVICE_CATEGORIES.map(cat => (
                        <div key={cat.slug}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#94a3b8", padding: "6px 16px 2px" }}>
                            {cat.name}
                          </div>
                          {cat.services.map(s => (
                            <TRow key={s.slug} onClick={() => selectService(s)}>
                              <span style={{ ...TILE, fontSize: 22 }}>{s.emoji}</span>
                              <div style={ROW_TEXT}><span style={ROW_TITLE}>{s.name}</span></div>
                            </TRow>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* WHERE */}
            {step === "where" && (
              <motion.div key="where" {...SLIDE} style={{ padding: "8px 8px 0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0f2748", padding: "4px 12px 8px" }}>Location</div>

                <TRow onClick={requestGeoLocation}>
                  <span style={TILE_DARK}>
                    {locLoading
                      ? <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><circle cx={12} cy={12} r={9} strokeOpacity={0.25} /><path d="M12 3a9 9 0 0 1 9 9" style={{ animation: "spin 0.8s linear infinite", transformOrigin: "center" }} /></svg>
                      : <Navigation size={20} color="#fff" />}
                  </span>
                  <div style={ROW_TEXT}>
                    <span style={ROW_TITLE}>Current location</span>
                    <span style={ROW_SUB}>{locLoading ? "Getting your location…" : "Use my GPS location"}</span>
                  </div>
                </TRow>

                {AU_CITIES.map(({ city, emoji }) => (
                  <TRow key={city} onClick={() => selectCity(city)}>
                    <span style={{ ...TILE, fontSize: 22 }}>{emoji}</span>
                    <div style={ROW_TEXT}>
                      <span style={ROW_TITLE}>{city}</span>
                      <span style={ROW_SUB}>Australia</span>
                    </div>
                    {location === city && (
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#3771db" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7" />
                      </svg>
                    )}
                  </TRow>
                ))}
              </motion.div>
            )}

            {/* WHEN */}
            {step === "when" && (
              <motion.div key="when" {...SLIDE} style={{ padding: "8px 16px 100px" }}>

                {/* Quick picks */}
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#0f2748", padding: "4px 0 10px" }}>Quick pick</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  {[{ label: "Today", sub: `Thu ${TODAY.d} Jun`, d: TODAY.d }, { label: "Tomorrow", sub: "Fri 26 Jun", d: TODAY.d + 1 }].map(q => {
                    const isSel = selDay?.y === TODAY.y && selDay?.m === TODAY.m && selDay?.d === q.d;
                    return (
                      <div
                        key={q.label}
                        onClick={() => { setSelDay({ y: TODAY.y, m: TODAY.m, d: q.d }); setViewY(TODAY.y); setViewM(TODAY.m); }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, border: `1px solid ${isSel ? "#3771db" : "#e6ebf2"}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer", background: isSel ? "rgba(55,113,219,0.06)" : "#fff", boxShadow: isSel ? "inset 0 0 0 1px #3771db" : "none" }}
                      >
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#0f2748" }}>{q.label}</span>
                        <span style={{ fontSize: 13, color: "#7c899c" }}>{q.sub}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar */}
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f4f8", padding: "16px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e6ebf2", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#0f2748" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                    </button>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#0f2748" }}>{MON_NAMES[viewM]} {viewY}</span>
                    <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e6ebf2", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#0f2748" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                    {WEEKDAYS.map(wd => (
                      <div key={wd} style={{ height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{wd}</div>
                    ))}
                  </div>

                  {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                      {week.map((d, di) => {
                        if (d === null) return <div key={di} />;
                        const isPast  = viewY < TODAY.y || (viewY === TODAY.y && viewM < TODAY.m) || (viewY === TODAY.y && viewM === TODAY.m && d < TODAY.d);
                        const isSel   = selDay?.y === viewY && selDay?.m === viewM && selDay?.d === d;
                        const isToday = viewY === TODAY.y && viewM === TODAY.m && d === TODAY.d;
                        return (
                          <div
                            key={di}
                            onClick={isPast ? undefined : () => setSelDay({ y: viewY, m: viewM, d })}
                            style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, borderRadius: 9999, cursor: isPast ? "default" : "pointer", color: isPast ? "#cbd5e1" : isSel ? "#fff" : "#1e293b", background: isSel ? "#051e3a" : "transparent", boxShadow: !isSel && isToday ? "inset 0 0 0 1.6px #c7d2e3" : "none" }}
                          >
                            {d}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: "#0f2748", marginBottom: 10 }}>Time of day</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {TIME_SLOTS.map(sl => {
                    const isAct = timeSlot === sl.key;
                    return (
                      <button
                        key={sl.key}
                        onClick={() => setTimeSlot(sl.key)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, border: `1px solid ${isAct ? "#3771db" : "#e6ebf2"}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer", fontWeight: 700, background: isAct ? "rgba(55,113,219,0.07)" : "#fff", color: isAct ? "#3771db" : "#0f2748", fontSize: 15 }}
                      >
                        <span>{sl.label}</span>
                        {sl.sub && <span style={{ fontSize: 12, fontWeight: 500, color: isAct ? "#3771db" : "#7c899c" }}>{sl.sub}</span>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Search CTA (pinned footer) ── */}
        <div style={{ padding: "12px 16px 28px", borderTop: "1px solid #f1f4f8", background: "#fff" }}>
          <button
            onClick={handleSearch}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#051e3a", color: "#fff", border: "none", borderRadius: 9999, padding: "16px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(5,30,58,0.28)" }}
          >
            <Search size={20} strokeWidth={2.2} />
            Search{service && <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 14 }}>· {service}</span>}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
