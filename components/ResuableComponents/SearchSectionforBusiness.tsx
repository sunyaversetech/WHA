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
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Clock, Navigation } from "lucide-react";
import { AU_CITIES } from "@/lib/data/services-catalog";
import { BUSINESS_CATEGORIES } from "@/lib/data/business-categories";

type ActiveSeg = "what" | "where" | "when" | null;

const MON_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MON_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  { key: "any", label: "Any time", sub: "" },
  { key: "morning", label: "Morning", sub: "9am – 12pm" },
  { key: "afternoon", label: "Afternoon", sub: "12pm – 5pm" },
  { key: "evening", label: "Evening", sub: "5pm – 12am" },
];

const TODAY = { y: 2026, m: 5, d: 25 }; // June 25 2026

function buildCalendar(viewY: number, viewM: number): (number | null)[][] {
  const first = new Date(viewY, viewM, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const dim = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const SLIDE = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { type: "spring" as const, stiffness: 320, damping: 24 },
};

/* ── shared inline tokens ── */
const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "12px 16px",
  borderRadius: 14,
  cursor: "pointer",
};
const TILE: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 13,
  background: "#eaf0fb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const TILE_DARK: React.CSSProperties = { ...TILE, background: "#051e3a" };
const ROW_TEXT: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.3,
  flex: 1,
};
const ROW_TITLE: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#1e293b",
};
const ROW_SUB: React.CSSProperties = { fontSize: 13, color: "#7c899c" };

function HoverRow({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...ROW, background: hov ? "#f4f7fb" : "transparent" }}>
      {children}
    </div>
  );
}

export default function BusinessSearchWithDates() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState({ top: 0, left: 0, width: 0, right: 0 });

  const [active, setActive] = useState<ActiveSeg>(null);
  const [service, setService] = useState(
    searchParams.get("service") || searchParams.get("search") || "",
  );
  const [location, setLocation] = useState(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return "Current location";
    return searchParams.get("city") || "";
  });
  const [geoCoords, setGeoCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return { lat: Number(lat), lng: Number(lng) };
    return null;
  });
  const [locLoading, setLocLoading] = useState(false);
  const [selDay, setSelDay] = useState<{
    y: number;
    m: number;
    d: number;
  } | null>(null);
  const [timeSlot, setTimeSlot] = useState("any");
  const [viewY, setViewY] = useState(TODAY.y);
  const [viewM, setViewM] = useState(TODAY.m);
  const [whatTab, setWhatTab] = useState<"Event" | "services">("services");

  const weeks = useMemo(() => buildCalendar(viewY, viewM), [viewY, viewM]);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!active) return;

    const updateAnchor = () => {
      const el = pillRef.current ?? containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setAnchor({
        top: rect.bottom + 16,
        left: rect.left,
        width: rect.width,
        right: window.innerWidth - rect.right,
      });
    };

    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    window.addEventListener("scroll", updateAnchor, true);
    return () => {
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("scroll", updateAnchor, true);
    };
  }, [active]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      const inDropdown = (e.target as Element).closest?.(
        "[data-search-dropdown]",
      );
      if (inDropdown) return;
      setActive(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (seg: ActiveSeg) =>
    setActive((prev) => (prev === seg ? null : seg));

  const requestGeoLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation("Current location");
        setLocLoading(false);
        setActive("when");
      },
      () => setLocLoading(false),
      { timeout: 8000 },
    );
  };

  const whenLabel = () => {
    if (!selDay)
      return TIME_SLOTS.find((s) => s.key === timeSlot)?.label || "Any time";
    const dayStr = `${selDay.d} ${MON_SHORT[selDay.m]}`;
    const slotStr =
      timeSlot !== "any"
        ? `, ${TIME_SLOTS.find((s) => s.key === timeSlot)?.label}`
        : "";
    return dayStr + slotStr;
  };

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (whatTab === "Event") params.set("tab", "events");
    if (service) params.set("service", service);
    if (geoCoords) {
      params.set("lat", String(geoCoords.lat));
      params.set("lng", String(geoCoords.lng));
    } else if (location) {
      params.set("city", location);
    }
    if (selDay)
      params.set(
        "date",
        `${selDay.y}-${String(selDay.m + 1).padStart(2, "0")}-${String(selDay.d).padStart(2, "0")}`,
      );
    if (timeSlot !== "any") params.set("time", timeSlot);
    router.push(`/search?${params.toString()}`);
    setActive(null);
  }, [service, location, geoCoords, selDay, timeSlot, router, whatTab]);

  const selectCity = (city: string) => {
    setGeoCoords(null);
    setLocation(city);
    setActive("when");
  };

  const prevMonth = () => {
    if (viewM === 0) {
      setViewY((y) => y - 1);
      setViewM(11);
    } else setViewM((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) {
      setViewY((y) => y + 1);
      setViewM(0);
    } else setViewM((m) => m + 1);
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center px-4 md:px-0">
      <div
        ref={pillRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 880,
          zIndex: active ? 100 : "auto",
        }}>
        {/* ── Pill ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f1f4f8",
            border: "1px solid #e6ebf2",
            borderRadius: 9999,
            padding: "5px 5px 5px 6px",
            boxShadow: "0 6px 28px rgba(2,12,26,0.05)",
          }}>
          {/* WHAT */}
          <div style={{ position: "relative", flex: 1.35 }}>
            {active === "what" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#fff",
                  borderRadius: 9999,
                  boxShadow: "0 2px 14px rgba(2,12,26,0.10)",
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "13px 20px",
                borderRadius: 9999,
                cursor: "text",
              }}
              onClick={() => setActive("what")}>
              <Search size={20} color="#64748b" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: service ? "#1e293b" : "#94a3b8",
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                {service || "All services"}
              </span>
              {service && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setService("");
                  }}
                  style={{
                    border: "none",
                    background: "rgba(0,0,0,0.08)",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}>
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 26,
              background: "#dde3ec",
              flexShrink: 0,
            }}
          />

          {/* WHERE */}
          <div style={{ position: "relative", flex: 1.1 }}>
            {active === "where" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#fff",
                  borderRadius: 9999,
                  boxShadow: "0 2px 14px rgba(2,12,26,0.10)",
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "13px 20px",
                borderRadius: 9999,
                cursor: "pointer",
              }}
              onClick={() => toggle("where")}>
              <MapPin size={20} color="#64748b" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: location ? "#1e293b" : "#94a3b8",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                }}>
                {location || "Map area"}
              </span>
              {location && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("");
                  }}
                  style={{
                    border: "none",
                    background: "rgba(0,0,0,0.08)",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}>
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 26,
              background: "#dde3ec",
              flexShrink: 0,
            }}
          />

          {/* WHEN */}
          <div style={{ position: "relative", flex: 1 }}>
            {active === "when" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#fff",
                  borderRadius: 9999,
                  boxShadow: "0 2px 14px rgba(2,12,26,0.10)",
                  zIndex: 0,
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 13,
                padding: "13px 20px",
                borderRadius: 9999,
                cursor: "pointer",
              }}
              onClick={() => toggle("when")}>
              <Clock size={20} color="#64748b" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#1e293b",
                  whiteSpace: "nowrap",
                }}>
                {whenLabel()}
              </span>
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            aria-label="Search services"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#051e3a",
              color: "#fff",
              border: "none",
              borderRadius: 9999,
              padding: "14px 26px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: 6,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a2d5a")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#051e3a")
            }>
            <Search size={18} strokeWidth={2.2} />
            Search
          </button>
        </div>

        {mounted &&
          active &&
          createPortal(
            <div
              onClick={() => setActive(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,18,35,0.14)",
                zIndex: 110,
              }}
            />,
            document.body,
          )}

        {/* ── WHAT PANEL ── */}
        {mounted &&
          active === "what" &&
          createPortal(
            <AnimatePresence>
              <motion.div
                {...SLIDE}
                data-search-dropdown
                style={{
                  position: "fixed",
                  top: anchor.top,
                  left: anchor.left,
                  width: Math.min(476, anchor.width),
                  background: "#fff",
                  border: "1px solid #eef1f5",
                  borderRadius: 26,
                  boxShadow: "0 28px 64px rgba(2,12,26,0.16)",
                  padding: "22px 10px 14px",
                  zIndex: 120,
                  maxHeight: 560,
                  overflowY: "auto",
                }}>
                {/* Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: 9,
                    padding: "0 14px 18px",
                    flexWrap: "wrap",
                  }}>
                  {(["services", "Event"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setWhatTab(tab)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        border: "1px solid",
                        borderColor: whatTab === tab ? "#051e3a" : "#e6ebf2",
                        borderRadius: 9999,
                        padding: "9px 16px",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: whatTab === tab ? "#051e3a" : "#fff",
                        color: whatTab === tab ? "#fff" : "#334155",
                      }}>
                      {tab === "Event" ? "Event" : "Services"}
                    </button>
                  ))}
                </div>

                {/* All services */}
                <div style={{ padding: "0 6px", marginBottom: 8 }}>
                  <HoverRow onClick={() => { setService(""); setActive("where"); }}>
                    <span style={{ ...TILE, background: "#f1f4f9" }}>
                      <Clock size={19} color="#64748b" />
                    </span>
                    <div style={ROW_TEXT}>
                      <span style={ROW_TITLE}>All services</span>
                      <span style={ROW_SUB}>Browse everything</span>
                    </div>
                  </HoverRow>
                </div>

                {/* Categories */}
                <div style={{ padding: "0 6px" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      color: "#0f2748",
                      padding: "8px 12px 6px",
                    }}>
                    Categories
                  </div>
                  {BUSINESS_CATEGORIES.map(({ label, value, icon: Icon }) => (
                    <HoverRow
                      key={value}
                      onClick={() => { setService(label); setActive("where"); }}>
                      <span style={TILE}>
                        <Icon size={19} color="#334155" />
                      </span>
                      <div style={ROW_TEXT}>
                        <span style={ROW_TITLE}>{label}</span>
                      </div>
                    </HoverRow>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}

        {/* ── WHERE PANEL ── */}
        {mounted &&
          active === "where" &&
          createPortal(
            <AnimatePresence>
              <motion.div
                {...SLIDE}
                data-search-dropdown
                style={{
                  position: "fixed",
                  top: anchor.top,
                  left: anchor.left + anchor.width * 0.32,
                  width: Math.min(432, anchor.width),
                  background: "#fff",
                  border: "1px solid #eef1f5",
                  borderRadius: 26,
                  boxShadow: "0 28px 64px rgba(2,12,26,0.16)",
                  padding: "14px 10px",
                  zIndex: 120,
                }}>
                <HoverRow onClick={requestGeoLocation}>
                  <span style={TILE_DARK}>
                    {locLoading ? (
                      <svg
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth={2.5}
                        strokeLinecap="round">
                        <circle cx={12} cy={12} r={9} strokeOpacity={0.25} />
                        <path
                          d="M12 3a9 9 0 0 1 9 9"
                          style={{
                            animation: "spin 0.8s linear infinite",
                            transformOrigin: "center",
                          }}
                        />
                      </svg>
                    ) : (
                      <Navigation size={20} color="#fff" />
                    )}
                  </span>
                  <div style={ROW_TEXT}>
                    <span style={ROW_TITLE}>Current location</span>
                    <span style={ROW_SUB}>
                      {locLoading
                        ? "Getting your location…"
                        : "Use my GPS location"}
                    </span>
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
                      <svg
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3771db"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7" />
                      </svg>
                    )}
                  </HoverRow>
                ))}
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}

        {/* ── WHEN PANEL ── */}
        {mounted &&
          active === "when" &&
          createPortal(
            <AnimatePresence>
              <motion.div
                {...SLIDE}
                data-search-dropdown
                style={{
                  position: "fixed",
                  top: anchor.top,
                  right: Math.max(16, anchor.right - 4),
                  width: Math.min(660, anchor.width + 80),
                  background: "#fff",
                  border: "1px solid #eef1f5",
                  borderRadius: 26,
                  boxShadow: "0 28px 64px rgba(2,12,26,0.16)",
                  padding: "22px 24px 20px",
                  zIndex: 120,
                }}>
                <div style={{ display: "flex", gap: 24 }}>
                  {/* Quick picks */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      width: 184,
                      flexShrink: 0,
                      paddingTop: 4,
                    }}>
                    {[
                      { label: "Today", sub: `Thu ${TODAY.d} Jun`, d: TODAY.d },
                      { label: "Tomorrow", sub: "Fri 26 Jun", d: TODAY.d + 1 },
                    ].map((q) => {
                      const isSel =
                        selDay?.y === TODAY.y &&
                        selDay?.m === TODAY.m &&
                        selDay?.d === q.d;
                      return (
                        <div
                          key={q.label}
                          onClick={() => {
                            setSelDay({ y: TODAY.y, m: TODAY.m, d: q.d });
                            setViewY(TODAY.y);
                            setViewM(TODAY.m);
                          }}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            border: `1px solid ${isSel ? "#3771db" : "#e6ebf2"}`,
                            borderRadius: 16,
                            padding: "14px 16px",
                            cursor: "pointer",
                            background: isSel
                              ? "rgba(55,113,219,0.06)"
                              : "#fff",
                            boxShadow: isSel
                              ? "inset 0 0 0 1px #3771db"
                              : "none",
                          }}>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "#0f2748",
                            }}>
                            {q.label}
                          </span>
                          <span style={{ fontSize: 13, color: "#7c899c" }}>
                            {q.sub}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 14,
                      }}>
                      <button
                        onClick={prevMonth}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: "1px solid #e6ebf2",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#0f2748",
                        }}>
                        <svg
                          width={17}
                          height={17}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round">
                          <path d="M15 6l-6 6 6 6" />
                        </svg>
                      </button>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#0f2748",
                        }}>
                        {MON_NAMES[viewM]} {viewY}
                      </span>
                      <button
                        onClick={nextMonth}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: "1px solid #e6ebf2",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#0f2748",
                        }}>
                        <svg
                          width={17}
                          height={17}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7,1fr)",
                        gap: 2,
                        marginBottom: 4,
                      }}>
                      {WEEKDAYS.map((wd) => (
                        <div
                          key={wd}
                          style={{
                            height: 30,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#94a3b8",
                          }}>
                          {wd}
                        </div>
                      ))}
                    </div>
                    {weeks.map((week, wi) => (
                      <div
                        key={wi}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7,1fr)",
                          gap: 2,
                        }}>
                        {week.map((d, di) => {
                          if (d === null) return <div key={di} />;
                          const isPast =
                            viewY < TODAY.y ||
                            (viewY === TODAY.y && viewM < TODAY.m) ||
                            (viewY === TODAY.y &&
                              viewM === TODAY.m &&
                              d < TODAY.d);
                          const isSel =
                            selDay?.y === viewY &&
                            selDay?.m === viewM &&
                            selDay?.d === d;
                          const isToday =
                            viewY === TODAY.y &&
                            viewM === TODAY.m &&
                            d === TODAY.d;
                          return (
                            <div
                              key={di}
                              onClick={
                                isPast
                                  ? undefined
                                  : () => setSelDay({ y: viewY, m: viewM, d })
                              }
                              style={{
                                height: 42,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 15,
                                fontWeight: 600,
                                borderRadius: 9999,
                                cursor: isPast ? "default" : "pointer",
                                color: isPast
                                  ? "#cbd5e1"
                                  : isSel
                                    ? "#fff"
                                    : "#1e293b",
                                background: isSel ? "#051e3a" : "transparent",
                                boxShadow:
                                  !isSel && isToday
                                    ? "inset 0 0 0 1.6px #c7d2e3"
                                    : "none",
                              }}>
                              {d}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderTop: "1px solid #eef1f5",
                    marginTop: 18,
                    paddingTop: 18,
                    flexWrap: "wrap",
                  }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0f2748",
                      marginRight: 4,
                    }}>
                    Time
                  </span>
                  {TIME_SLOTS.map((sl) => {
                    const isAct = timeSlot === sl.key;
                    return (
                      <button
                        key={sl.key}
                        onClick={() => setTimeSlot(sl.key)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 1,
                          border: `1px solid ${isAct ? "#3771db" : "#e6ebf2"}`,
                          borderRadius: 14,
                          padding: "9px 16px",
                          fontSize: 14,
                          cursor: "pointer",
                          fontWeight: 700,
                          background: isAct ? "rgba(55,113,219,0.07)" : "#fff",
                          color: isAct ? "#3771db" : "#0f2748",
                        }}>
                        <span>{sl.label}</span>
                        {sl.sub && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: isAct ? "#3771db" : "#7c899c",
                            }}>
                            {sl.sub}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )}
      </div>
    </div>
  );
}
