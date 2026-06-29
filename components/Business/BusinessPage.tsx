"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import BusinessCard from "@/components/cards/business-card";
import EventCard from "@/components/cards/event-card";
import BusinessHeader from "./BusinessFilter";
import EventHeader from "@/components/Event/EventFilter";
import { useGetBusiness } from "@/services/business.service";
import { useGetAllEvents } from "@/services/event.service";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, ChevronLeft } from "lucide-react";
import MobileBusinessSearchWithDates from "@/components/ResuableComponents/MobileViewSearch/SearchSectionforBusiness";

const BusinessMap = dynamic(() => import("./business-map"), { ssr: false });
const EventMap = dynamic(() => import("@/components/Event/Event-map"), {
  ssr: false,
});

type ListType = "services" | "events";

/* ── Shared design tokens ── */
const BTN_TOOLBAR: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #e9edf3",
  background: "#fff",
  color: "#0f2748",
  fontWeight: 600,
  fontSize: 14,
  padding: "9px 16px",
  borderRadius: 9999,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/* ── Hover-aware toolbar button ── */
function ToolBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...BTN_TOOLBAR,
        background: hov ? "#f4f7fb" : "#fff",
        transition: "background .15s",
      }}>
      {children}
    </button>
  );
}

/* ══════════════════════════════════════
   FILTERS MODAL
═══════════════════════════════════════ */
function FiltersModal({
  open,
  onClose,
  listType,
  onListTypeChange,
}: {
  open: boolean;
  onClose: () => void;
  listType: ListType;
  onListTypeChange: (type: ListType) => void;
}) {
  if (!open) return null;

  const TAB_BASE: React.CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 15,
    padding: "11px",
    borderRadius: 10,
    cursor: "pointer",
    flex: 1,
  };
  const TAB_ACT: React.CSSProperties = {
    ...TAB_BASE,
    background: "#fff",
    color: "#0f2748",
    fontWeight: 700,
    boxShadow: "0 1px 5px rgba(2,12,26,0.10)",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,18,35,0.44)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680,
          maxWidth: "100%",
          maxHeight: "88vh",
          background: "#fff",
          borderRadius: 26,
          boxShadow: "0 40px 90px rgba(2,12,26,0.32)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "26px 32px 16px",
          }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0f2748" }}>
            Filters
          </span>
          <button
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background: "#f1f4f8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}>
            <X size={18} color="#0f2748" strokeWidth={2.2} />
          </button>
        </div>

        {/* Body — only toggle + category */}
        <div style={{ padding: "4px 32px 24px", overflowY: "auto", flex: 1 }}>
          {/* Services / Events toggle */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "#f1f4f8",
              borderRadius: 14,
              padding: 4,
              marginBottom: 28,
            }}>
            <button
              onClick={() => onListTypeChange("services")}
              style={listType === "services" ? TAB_ACT : TAB_BASE}>
              Services
            </button>
            <button
              onClick={() => onListTypeChange("events")}
              style={listType === "events" ? TAB_ACT : TAB_BASE}>
              Events
            </button>
          </div>

          {/* Category filter */}
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0f2748",
                marginBottom: 12,
              }}>
              Category
            </div>
            {listType === "services" ? <BusinessHeader /> : <EventHeader />}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 32px",
            borderTop: "1px solid #eef1f5",
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: 12,
          }}>
          <button
            onClick={() => onListTypeChange("services")}
            style={{
              border: "1px solid #d8dfe9",
              background: "#fff",
              color: "#0f2748",
              fontWeight: 700,
              fontSize: 15,
              padding: 14,
              borderRadius: 13,
              cursor: "pointer",
            }}>
            Clear all
          </button>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "#051e3a",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              padding: 14,
              borderRadius: 13,
              cursor: "pointer",
            }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function BusinessesClientPage() {
  const { data: apiResponse, isLoading: isLoadingBusinesses } =
    useGetBusiness();
  const { data: eventsResponse, isLoading: isLoadingEvents } =
    useGetAllEvents();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showMap, setShowMap] = useState(true);
  const [listType, setListType] = useState<ListType>(() =>
    searchParams.get("tab") === "events" ? "events" : "services",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBoundsChange = useCallback(
    (bounds: { swLat: number; swLng: number; neLat: number; neLng: number }) => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
      boundsTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("swLat", String(bounds.swLat));
        params.set("swLng", String(bounds.swLng));
        params.set("neLat", String(bounds.neLat));
        params.set("neLng", String(bounds.neLng));
        router.replace(`/search?${params.toString()}`, { scroll: false });
      }, 600);
    },
    [searchParams, router],
  );

  const businesses = useMemo(() => apiResponse?.data || [], [apiResponse]);
  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse]);
  const isServices = listType === "services";
  const data = isServices ? businesses : events;

  const userLat = searchParams.get("lat")
    ? Number(searchParams.get("lat"))
    : null;
  const userLng = searchParams.get("lng")
    ? Number(searchParams.get("lng"))
    : null;

  const enrichedBusinesses = useMemo(() => {
    const withDistance = businesses.map((b: any) => {
      if (typeof b.distance === "number") return b;
      if (userLat !== null && userLng !== null && b.latitude && b.longitude) {
        return {
          ...b,
          distance: haversineMetres(
            userLat,
            userLng,
            Number(b.latitude),
            Number(b.longitude),
          ),
        };
      }
      return b;
    });
    const sorted =
      userLat !== null && userLng !== null
        ? [...withDistance].sort((a: any, b: any) => {
            const da = typeof a.distance === "number" ? a.distance : Infinity;
            const db = typeof b.distance === "number" ? b.distance : Infinity;
            return da - db;
          })
        : withDistance;
    // Cap at 1000 km when geo coords are present
    if (userLat !== null && userLng !== null) {
      return sorted.filter(
        (b: any) =>
          typeof b.distance !== "number" || b.distance <= 1000 * 1000,
      );
    }
    return sorted;
  }, [businesses, userLat, userLng]);
  const isLoading = isServices ? isLoadingBusinesses : isLoadingEvents;
  const service =
    searchParams.get("service") || searchParams.get("search") || "";
  const cityLabel = searchParams.get("city") ?? "Australia";
  const countText = isLoading
    ? "Loading…"
    : isServices
      ? `${businesses.length}${businesses.length === 0 ? "" : "+"} services in ${cityLabel}`
      : `${events.length}${events.length === 0 ? "" : "+"} events in ${cityLabel}`;

  /* ── Segment toggle ── */
  const SEG_BASE: React.CSSProperties = {
    border: "none",
    background: "transparent",
    color: "#475569",
    fontWeight: 600,
    fontSize: 14,
    padding: "8px 20px",
    borderRadius: 9999,
    cursor: "pointer",
  };
  const SEG_ACT: React.CSSProperties = {
    ...SEG_BASE,
    background: "#051e3a",
    color: "#fff",
    fontWeight: 700,
  };

  /* ── Mobile search header (list + map overlay) ── */
  const MobileSearchHeader = () => (
    <>
      {/* Top row: back · search info · map/list toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid #e6ebf2",
        }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid #e6ebf2",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}>
          <ChevronLeft size={20} color="#0f2748" />
        </button>

        <div
          onClick={() => setSearchOpen(true)}
          style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0f2748",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {service || "All services and events"}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 1 }}>
            Any time · {cityLabel}
          </div>
        </div>

        <button
          onClick={() => setMobileMapOpen((v) => !v)}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "1.5px solid #e0e4ea",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(2,12,26,0.08)",
          }}>
          {mobileMapOpen ? (
            /* List icon */
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f2748"
              strokeWidth={2}
              strokeLinecap="round">
              <line x1={3} y1={6} x2={21} y2={6} />
              <line x1={3} y1={12} x2={21} y2={12} />
              <line x1={3} y1={18} x2={21} y2={18} />
            </svg>
          ) : (
            /* Map icon */
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0f2748"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z" />
              <line x1={9} y1={4} x2={9} y2={17} />
              <line x1={15} y1={6.5} x2={15} y2={19.5} />
            </svg>
          )}
        </button>
      </div>

      {/* Filter chips (horizontally scrollable) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          overflowX: "auto",
          scrollbarWidth: "none" as const,
        }}
        className="[&::-webkit-scrollbar]:hidden">
        {/* Filter icon button */}
        <button
          onClick={() => setFiltersOpen(true)}
          style={{
            width: 38,
            height: 38,
            border: "1px solid #e6ebf2",
            background: "#fff",
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}>
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0f2748"
            strokeWidth={2}
            strokeLinecap="round">
            <line x1={4} y1={7} x2={20} y2={7} />
            <line x1={4} y1={17} x2={20} y2={17} />
            <circle cx={9} cy={7} r={2.4} fill="#fff" />
            <circle cx={15} cy={17} r={2.4} fill="#fff" />
          </svg>
        </button>

        {/* Venues / Events chip */}
        <button
          onClick={() =>
            setListType(listType === "services" ? "events" : "services")
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            border: "1px solid #e6ebf2",
            background: "#fff",
            color: "#0f2748",
            borderRadius: 9999,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
          {listType === "services" ? "Services" : "Events"}
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
    </>
  );

  /* ── Toolbar ── */
  const Toolbar = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 22,
        flexWrap: "wrap",
      }}>
      {/* Services / Events pill */}
      <div
        style={{
          display: "flex",
          background: "#fff",
          border: "1px solid #e9edf3",
          borderRadius: 9999,
          padding: 4,
          flexShrink: 0,
        }}>
        <button
          onClick={() => setListType("services")}
          style={listType === "services" ? SEG_ACT : SEG_BASE}>
          Services
        </button>
        <button
          onClick={() => setListType("events")}
          style={listType === "events" ? SEG_ACT : SEG_BASE}>
          Events
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: 13,
          color: "#64748b",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}>
        {countText}
      </span>

      {/* Filters */}
      <ToolBtn onClick={() => setFiltersOpen(true)}>
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round">
          <line x1={4} y1={7} x2={20} y2={7} />
          <line x1={4} y1={17} x2={20} y2={17} />
          <circle cx={9} cy={7} r={2.4} fill="#fff" />
          <circle cx={15} cy={17} r={2.4} fill="#fff" />
        </svg>
        Filters
      </ToolBtn>

      {/* Desktop map toggle */}
      <div className="hidden md:block">
        <ToolBtn onClick={() => setShowMap((v) => !v)}>
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z" />
            <line x1={9} y1={4} x2={9} y2={17} />
            <line x1={15} y1={6.5} x2={15} y2={19.5} />
          </svg>
          {showMap ? "Hide map" : "Show map"}
        </ToolBtn>
      </div>

      {/* Mobile map toggle */}
      <div className="md:hidden">
        <ToolBtn onClick={() => setMobileMapOpen((v) => !v)}>
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z" />
            <line x1={9} y1={4} x2={9} y2={17} />
            <line x1={15} y1={6.5} x2={15} y2={19.5} />
          </svg>
          {mobileMapOpen ? "Hide map" : "Map"}
        </ToolBtn>
      </div>
    </div>
  );

  /* ── Card grid ── */
  const CardGrid = ({ cols }: { cols: number }) => {
    if (isLoading) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: cols === 2 ? "30px 24px" : "34px 26px",
          }}>
          {Array.from({ length: cols === 1 ? 4 : cols === 2 ? 4 : 6 }).map(
            (_, i) => (
              <div key={i}>
                <Skeleton
                  style={{
                    aspectRatio: "16/11",
                    borderRadius: 18,
                    width: "100%",
                  }}
                />
                <div style={{ marginTop: 12 }}>
                  <Skeleton
                    style={{
                      height: 14,
                      width: "65%",
                      borderRadius: 7,
                      marginBottom: 8,
                    }}
                  />
                  <Skeleton
                    style={{ height: 12, width: "45%", borderRadius: 7 }}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            textAlign: "center",
          }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "#f1f4f8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}>
            <Search size={26} color="#94a3b8" />
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0f2748",
              marginBottom: 6,
            }}>
            {service
              ? `No results for "${service}"`
              : isServices
                ? "No services found"
                : "No events found"}
          </div>
          <div style={{ fontSize: 14, color: "#64748b", maxWidth: 300 }}>
            {isServices
              ? "Try a different service, location, or clear your filters."
              : "Try a different event, location, or clear your filters."}
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: cols === 2 ? "30px 24px" : cols === 1 ? "20px" : "34px 26px",
        }}>
        {isServices
          ? enrichedBusinesses.map((b: any) => (
              <BusinessCard key={b._id} business={b} />
            ))
          : events.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
      </div>
    );
  };

  /* ── Map container ── */
  const MapBox = ({
    height,
    radius = 20,
  }: {
    height: string | number;
    radius?: number;
  }) => (
    <div
      style={{
        position: "relative",
        borderRadius: radius,
        overflow: "hidden",
        height,
        background: "#e9eef0",
        border: "1px solid #e2e8ee",
      }}>
      {isServices ? (
        <BusinessMap
          businesses={enrichedBusinesses}
          currentCity={searchParams.get("city") || ""}
          isVisible
          isExpanded={false}
          onToggleExpand={() => {}}
          userLat={userLat ?? undefined}
          userLng={userLng ?? undefined}
          onBoundsChange={handleBoundsChange}
        />
      ) : (
        <EventMap
          businesses={events}
          currentCity={searchParams.get("city") || ""}
          isVisible
          isExpanded={false}
          onToggleExpand={() => {}}
        />
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Spacer below sticky header — desktop only (mobile navbar is hidden on this page) */}
      <div className="hidden md:block pt-[88px]" />

      <main
        style={{ maxWidth: 1680, margin: "0 auto", padding: "20px 16px 56px" }}
        className="md:px-10">
        {/* ════════════ DESKTOP ════════════ */}
        <div className="hidden md:block">
          {showMap ? (
            /* With map: 2-col card grid + sticky map */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.04fr) 0.96fr",
                gap: 26,
                alignItems: "start",
              }}>
              <div style={{ minWidth: 0 }}>
                {Toolbar()}
                {CardGrid({ cols: 2 })}
              </div>
              <div style={{ position: "sticky", top: 96 }}>
                {MapBox({ height: "calc(100vh - 168px)" })}
              </div>
            </div>
          ) : (
            /* No map: 3-col card grid */
            <>
              {Toolbar()}
              {CardGrid({ cols: 3 })}
            </>
          )}
        </div>

        {/* ════════════ MOBILE ════════════ */}
        <div className="md:hidden" style={{ margin: "-20px -16px 0" }}>
          {/* Sticky header (list mode) */}
          {!mobileMapOpen && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 40,
                background: "#fff",
                borderBottom: "1px solid #f1f4f8",
              }}>
              {MobileSearchHeader()}
            </div>
          )}

          {/* List */}
          {!mobileMapOpen && (
            <div style={{ padding: "12px 16px 80px" }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  fontWeight: 500,
                  marginBottom: 12,
                }}>
                {countText}
              </div>
              {CardGrid({ cols: 1 })}
            </div>
          )}

          {/* Full-screen map overlay */}
          {mobileMapOpen && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 45,
                display: "flex",
                flexDirection: "column",
                background: "#e9eef0",
              }}>
              <div
                style={{
                  background: "#fff",
                  borderBottom: "1px solid #f1f4f8",
                  flexShrink: 0,
                }}>
                {MobileSearchHeader()}
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                {MapBox({ height: "100%", radius: 0 })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Headless search drawer — opened when tapping the mobile search header */}
      <div className="md:hidden">
        <MobileBusinessSearchWithDates
          open={searchOpen}
          onOpenChange={setSearchOpen}
        />
      </div>

      {/* Filters modal */}
      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        listType={listType}
        onListTypeChange={setListType}
      />
    </div>
  );
}
