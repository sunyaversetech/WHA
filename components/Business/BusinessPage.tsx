"use client";

import { useState, useMemo } from "react";
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
import { useSearchLocation } from "@/components/ResuableComponents/LocationSearch/useSearchLocation";
import { useDistanceEnriched } from "@/components/ResuableComponents/LocationSearch/geo";

const SearchMap = dynamic(() => import("./SearchMap"), { ssr: false });

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
type SortKey = "best" | "nearest" | "top";

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
  const [sortBy, setSortBy] = useState<SortKey>("best");
  const [maxPrice, setMaxPrice] = useState(1400);

  if (!open) return null;

  const SORT_BASE: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 11,
    border: "1.5px solid #e6ebf2",
    borderRadius: 16,
    padding: "20px 12px",
    cursor: "pointer",
    background: "#fff",
    color: "#0f2748",
    fontWeight: 700,
    fontSize: 14,
    width: "100%",
  };
  const SORT_SEL: React.CSSProperties = {
    ...SORT_BASE,
    borderColor: "#3771db",
    background: "rgba(55,113,219,0.07)",
    color: "#3771db",
  };
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

        {/* Body */}
        <div style={{ padding: "4px 32px 10px", overflowY: "auto", flex: 1 }}>
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
          <div style={{ marginBottom: 28 }}>
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

          {/* Services-only filters */}
          {listType === "services" && (
            <>
              {/* Sort by */}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f2748",
                  marginBottom: 12,
                }}>
                Sort by
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 12,
                  marginBottom: 28,
                }}>
                <button
                  onClick={() => setSortBy("best")}
                  style={sortBy === "best" ? SORT_SEL : SORT_BASE}>
                  <svg
                    width={22}
                    height={22}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round">
                    <circle cx={12} cy={12} r={9} />
                    <circle cx={12} cy={12} r={4.5} />
                  </svg>
                  Best match
                </button>
                <button
                  onClick={() => setSortBy("nearest")}
                  style={sortBy === "nearest" ? SORT_SEL : SORT_BASE}>
                  <svg
                    width={22}
                    height={22}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                    <circle cx={12} cy={10} r={2.5} />
                  </svg>
                  Nearest
                </button>
                <button
                  onClick={() => setSortBy("top")}
                  style={sortBy === "top" ? SORT_SEL : SORT_BASE}>
                  <svg
                    width={22}
                    height={22}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round">
                    <path d="M12 3.5l2.6 5.6 6 .5-4.5 4 1.3 5.9L12 16.9 6.6 19.5l1.3-5.9-4.5-4 6-.5z" />
                  </svg>
                  Top rated
                </button>
              </div>

              {/* Max price */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}>
                <span
                  style={{ fontSize: 16, fontWeight: 700, color: "#0f2748" }}>
                  Max price
                </span>
                <span
                  style={{ fontSize: 15, fontWeight: 700, color: "#0f2748" }}>
                  A${maxPrice}
                  {maxPrice >= 1400 ? "+" : ""}
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={1400}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(+e.target.value)}
                style={{
                  width: "100%",
                  accentColor: "#051e3a",
                  height: 5,
                  cursor: "pointer",
                  marginBottom: 28,
                }}
              />

              {/* Verified pros */}
              {/* <div style={{ fontSize: 16, fontWeight: 700, color: "#0f2748", marginBottom: 16 }}>
                Only show
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 6 }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: "#eaf0fb", display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                  <svg width={20} height={20} viewBox="0 0 24 24">
                    <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.6-1 2.9 1 2.9-2.5 1.6-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.2 14l1-2.9-1-2.9 2.5-1.6.9-2.9 3 .2L12 2Z" fill="#3771db" />
                    <path d="M8.5 12l2.4 2.4 4.6-4.8" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f2748" }}>Verified pros</div>
                  <div style={{ fontSize: 13, color: "#7c899c" }}>These venues accept WHA gift cards</div>
                </div>
                <div
                  onClick={() => setVerified((v) => !v)}
                  role="switch"
                  aria-checked={verified}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === " " && setVerified((v) => !v)}
                  style={{
                    width: 46, height: 27, borderRadius: 9999,
                    background: verified ? "#051e3a" : "#d4dbe5",
                    padding: 3, display: "flex", cursor: "pointer",
                    transition: "background .15s", flexShrink: 0,
                  }}>
                  <div
                    style={{
                      width: 21, height: 21, borderRadius: "50%",
                      background: "#fff",
                      transform: verified ? "translateX(19px)" : "translateX(0)",
                      transition: "transform .15s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                    }}
                  />
                </div>
              </div> */}
            </>
          )}
        </div>

        <div
          style={{
            padding: "16px 32px",
            borderTop: "1px solid #eef1f5",
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: 12,
          }}>
          <button
            onClick={() => {
              setSortBy("best");
              setMaxPrice(1400);
              onListTypeChange("services");
            }}
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

  const businesses = useMemo(() => apiResponse?.data || [], [apiResponse]);
  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse]);
  const isServices = listType === "services";

  // Shared location state — GPS auto-request, manual map-area override, and
  // city selection all live here, driven off the URL params (the single
  // source of truth shared with the search bar mounted in the Navbar).
  const {
    userLat,
    userLng,
    searchLocationMode,
    refLat,
    refLng,
    geoDenied,
    handleBoundsChange,
  } = useSearchLocation();

  const enrichedBusinesses = useDistanceEnriched(businesses, refLat, refLng);
  const enrichedEvents = useDistanceEnriched(events, refLat, refLng);
  const data = isServices ? enrichedBusinesses : enrichedEvents;
  const isLoading = isServices ? isLoadingBusinesses : isLoadingEvents;
  const service =
    searchParams.get("service") || searchParams.get("search") || "";
  const isNearMe =
    !searchParams.get("city") && refLat !== null && refLng !== null;
  const nearLabel = searchLocationMode === "mapArea" ? "in this map area" : "near you";
  const cityLabel = searchParams.get("city") ?? (isNearMe ? "" : "Australia");
  const countText = isLoading
    ? "Loading…"
    : isServices
      ? `${businesses.length}${businesses.length === 0 ? "" : "+"} services ${isNearMe ? nearLabel : `in ${cityLabel}`}`
      : `${events.length}${events.length === 0 ? "" : "+"} events ${isNearMe ? nearLabel : `in ${cityLabel}`}`;

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
            Any time · {isNearMe ? "Near you" : cityLabel}
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

        {/* Services / Events pill — same segmented toggle as desktop, so the
           choice always reads as "pick one of two", not "tap to flip". */}
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
          : enrichedEvents.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
      </div>
    );
  };

  /* ── Map container ── */
  const MapBox = ({
    height,
    radius = 20,
    isVisible = true,
  }: {
    height: string | number;
    radius?: number;
    isVisible?: boolean;
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
      <SearchMap
        activeType={listType}
        businesses={enrichedBusinesses}
        events={enrichedEvents}
        currentCity={searchParams.get("city") || ""}
        userLat={userLat ?? undefined}
        userLng={userLng ?? undefined}
        searchLocationMode={searchLocationMode}
        onBoundsChange={handleBoundsChange}
        isVisible={isVisible}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Spacer below sticky header — desktop only (mobile navbar is hidden on this page) */}
      <div className="hidden md:block pt-[88px]" />

      <main
        style={{ maxWidth: 1680, margin: "0 auto", padding: "20px 16px 56px" }}
        className="md:px-10">
        {geoDenied && userLat === null && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e9edf3",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 13,
              color: "#64748b",
              marginBottom: 16,
            }}>
            Location access is disabled. Search for a location manually to
            see nearby results.
          </div>
        )}

        {/* ════════════ DESKTOP ════════════ */}
        {/* The map column always stays mounted — only its width/opacity
           toggle with showMap — so the underlying map instance (position,
           zoom, selected marker) survives hiding it, instead of being
           destroyed and recreated (which would reset it) every time. */}
        <div className="hidden md:block">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: showMap ? "minmax(0, 1.04fr) 0.96fr" : "1fr 0px",
              gap: showMap ? 26 : 0,
              alignItems: "start",
            }}>
            <div style={{ minWidth: 0 }}>
              {Toolbar()}
              {CardGrid({ cols: showMap ? 2 : 3 })}
            </div>
            <div
              style={{
                position: "sticky",
                top: 96,
                width: showMap ? undefined : 0,
                height: showMap ? undefined : 0,
                opacity: showMap ? 1 : 0,
                overflow: "hidden",
                pointerEvents: showMap ? "auto" : "none",
              }}>
              {MapBox({ height: "calc(100vh - 168px)", isVisible: showMap })}
            </div>
          </div>
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

          {/* Full-screen map overlay — always mounted, hidden via CSS
             rather than unmounted, so the map instance (position, zoom,
             selected marker) survives closing it. */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: mobileMapOpen ? 45 : -1,
              display: "flex",
              flexDirection: "column",
              background: "#e9eef0",
              visibility: mobileMapOpen ? "visible" : "hidden",
              opacity: mobileMapOpen ? 1 : 0,
              pointerEvents: mobileMapOpen ? "auto" : "none",
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
              {MapBox({ height: "100%", radius: 0, isVisible: mobileMapOpen })}
            </div>
          </div>
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
