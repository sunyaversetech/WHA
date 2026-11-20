"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import BusinessCard from "@/components/cards/business-card";
import EventCard from "@/components/cards/event-card";
import BusinessHeader from "./BusinessFilter";
import EventHeader from "@/components/Event/EventFilter";
import { useGetBusiness } from "@/services/business.service";
import { useGetAllEvents } from "@/services/event.service";
import { useGetBatchAvailableSlots } from "@/services/booking.service";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, ChevronLeft, SlidersVertical, Map as MapIcon, List as ListIcon, ChevronDown, CalendarClock } from "lucide-react";
import MobileBusinessSearchWithDates from "@/components/ResuableComponents/MobileViewSearch/SearchSectionforBusiness";
import { useSearchLocation } from "@/components/ResuableComponents/LocationSearch/useSearchLocation";
import { useDistanceEnriched } from "@/components/ResuableComponents/LocationSearch/geo";
import DaySelector, { toDateKey } from "./DaySelector";
import { useSearchMapVisibility } from "./search-map-visibility";

const SearchMap = dynamic(() => import("./SearchMap"), { ssr: false });

type ListType = "services" | "events";

/* ── Shared atoms (fresha-search-kit/spec/04) ── */
const outlineBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 36,
  padding: "0 15px",
  border: "1px solid var(--border-strong)",
  borderRadius: 9999,
  background: "var(--background)",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "20px",
  whiteSpace: "nowrap",
  cursor: "pointer",
};

function SegmentedControl({
  listType,
  onChange,
  fullWidth,
}: {
  listType: ListType;
  onChange: (t: ListType) => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      data-ui="result-type-toggle"
      style={{
        display: "flex",
        flexShrink: fullWidth ? undefined : 0,
        width: fullWidth ? "100%" : undefined,
        height: 32,
        borderRadius: 9999,
        background: "var(--muted)",
        boxShadow: "0 0 0 1px var(--border)",
      }}>
      {(["events", "services"] as ListType[]).map((t) => {
        const active = listType === t;
        return (
          <button
            key={t}
            data-ui="result-type-option"
            aria-pressed={active}
            onClick={() => onChange(t)}
            style={{
              flex: fullWidth ? 1 : undefined,
              height: 32,
              padding: "6px 12px",
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              lineHeight: "20px",
              whiteSpace: "nowrap",
              border: "none",
              cursor: "pointer",
              color: "var(--foreground)",
              background: active ? "var(--background)" : "transparent",
              boxShadow: active ? "0 0 0 1px var(--border-strong)" : "none",
            }}>
            {t === "events" ? "Events" : "Services"}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════
   FILTERS MODAL
═══════════════════════════════════════ */
type SortKey = "best" | "nearest" | "soonest";

function FiltersModal({
  open,
  onClose,
  listType,
  onListTypeChange,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  listType: ListType;
  onListTypeChange: (type: ListType) => void;
  resultCount: number;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("best");
  const [maxPrice, setMaxPrice] = useState(1400);

  if (!open) return null;

  const TILE_BASE: React.CSSProperties = {
    height: 96,
    borderRadius: 16,
    boxShadow: "inset 0 0 0 1px var(--border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
    color: "var(--foreground)",
    cursor: "pointer",
    background: "var(--background)",
  };
  const TILE_SEL: React.CSSProperties = {
    ...TILE_BASE,
    background: "var(--accent)",
    color: "var(--secondary)",
    boxShadow: "inset 0 0 0 2px var(--secondary)",
  };

  return (
    <div
      data-ui="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(var(--color-primary-rgb), .25)",
        zIndex: 2000,
      }}>
      <div
        data-ui="filters-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: 32,
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          maxWidth: "100%",
          maxHeight: "calc(100vh - 64px)",
          background: "var(--background)",
          borderRadius: 32,
          boxShadow: "var(--shadow-elevated)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
        {/* Header */}
        <div
          data-ui="filters-modal-header"
          style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "32px 48px 8px" }}>
          <div
            data-ui="filters-modal-title"
            style={{ flex: 1, fontSize: 22, fontWeight: 600, lineHeight: "28px", letterSpacing: "-0.2px", color: "var(--foreground)" }}>
            Filters
          </div>
          <button
            data-ui="filters-modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 48,
              height: 48,
              margin: -12,
              borderRadius: 9999,
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}>
            <X size={24} color="var(--foreground)" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 48px 32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          <SegmentedControl listType={listType} onChange={onListTypeChange} fullWidth />

          <div>
            <span data-ui="filters-section-title" style={{ display: "block", fontSize: 16, fontWeight: 600, lineHeight: "22px", color: "var(--foreground)", marginBottom: 16 }}>
              Category
            </span>
            {listType === "services" ? <BusinessHeader /> : <EventHeader />}
          </div>

          {listType === "services" && (
            <>
              <hr style={{ border: 0, height: 1, background: "var(--foreground)", opacity: 0.1, margin: 0 }} />
              <div>
                <span data-ui="filters-section-title" style={{ display: "block", fontSize: 16, fontWeight: 600, lineHeight: "22px", color: "var(--foreground)", marginBottom: 16 }}>
                  Sort by
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  <div data-ui="filters-tile" onClick={() => setSortBy("best")} style={sortBy === "best" ? TILE_SEL : TILE_BASE}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"><circle cx={12} cy={12} r={9} /><circle cx={12} cy={12} r={4.5} /></svg>
                    Best match
                  </div>
                  <div data-ui="filters-tile" onClick={() => setSortBy("nearest")} style={sortBy === "nearest" ? TILE_SEL : TILE_BASE}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx={12} cy={10} r={2.5} /></svg>
                    Nearest
                  </div>
                  <div data-ui="filters-tile" onClick={() => setSortBy("soonest")} style={sortBy === "soonest" ? TILE_SEL : TILE_BASE}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 2" /></svg>
                    Soonest
                  </div>
                </div>
              </div>

              <hr style={{ border: 0, height: 1, background: "var(--foreground)", opacity: 0.1, margin: 0 }} />
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <span data-ui="filters-section-title" style={{ fontSize: 16, fontWeight: 600, lineHeight: "22px", color: "var(--foreground)" }}>
                    Price range
                  </span>
                  <span style={{ fontSize: 14, lineHeight: "20px", color: "var(--foreground)" }}>
                    A${maxPrice}{maxPrice >= 1400 ? "+" : ""}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={1400}
                  step={50}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(+e.target.value)}
                  style={{ width: "100%", accentColor: "var(--secondary)", height: 4, cursor: "pointer" }}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          data-ui="filters-modal-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 48px 32px",
            borderTop: "1px solid var(--border)",
          }}>
          <button
            data-ui="filters-clear-button"
            onClick={() => {
              setSortBy("best");
              setMaxPrice(1400);
              onListTypeChange("events");
            }}
            style={{
              flex: 1,
              height: 48,
              border: "1px solid var(--border-strong)",
              background: "var(--background)",
              color: "var(--foreground)",
              fontWeight: 600,
              fontSize: 16,
              lineHeight: "22px",
              letterSpacing: "-0.1px",
              borderRadius: 9999,
              cursor: "pointer",
            }}>
            Clear all
          </button>
          <button
            data-ui="filters-apply-button"
            onClick={onClose}
            style={{
              flex: 1,
              height: 48,
              border: "1px solid var(--primary)",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontWeight: 600,
              fontSize: 16,
              lineHeight: "22px",
              letterSpacing: "-0.1px",
              borderRadius: 9999,
              cursor: "pointer",
            }}>
            Show {resultCount} {listType === "services" ? "services" : "events"}
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
  // The map panel is position:fixed to the viewport, so it would otherwise
  // float over the sitewide Footer (rendered in app/layout.tsx, outside
  // this component) once scrolled into view. Footer reads this to shrink
  // itself to the results-column width while the map's showing, and go
  // full width once it's hidden.
  const setMapVisible = useSearchMapVisibility((s) => s.setMapVisible);
  useEffect(() => {
    setMapVisible(showMap);
    return () => setMapVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);
  // Events is the default/first tab — Services stays available as the other
  // tab, only shown when explicitly requested via ?tab=services.
  const [listType, setListType] = useState<ListType>(() =>
    searchParams.get("tab") === "services" ? "services" : "events",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  // Desktop-only "expand map" — makes the normally fixed-sidebar map panel
  // cover the full viewport, hiding the results column (mirrors mobile's
  // mobileMapOpen full-screen mode, which is a separate flag since it also
  // hides the controls and shows its own top bar instead).
  const [isMapExpanded, setIsMapExpanded] = useState(false);
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
    handleBoundsChange,
    bounds,
  } = useSearchLocation();

  const enrichedBusinesses = useDistanceEnriched(businesses, refLat, refLng);
  const enrichedEvents = useDistanceEnriched(events, refLat, refLng);
  const data = isServices ? enrichedBusinesses : enrichedEvents;

  // Live time-slot buttons on each business card. `selectedDate === null`
  // means "Any day" — no date filter, batched slots query stays disabled.
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const selectedDateKey = toDateKey(selectedDate);
  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";
  const slotItems = useMemo(() => {
    if (!isServices || !selectedDateKey) return [];
    const items: { business_id: string; service_id: string }[] = [];
    for (const b of enrichedBusinesses) {
      const topServiceIds = (b.services ?? [])
        .filter((s: any) => s.is_active)
        .sort((a: any, b2: any) => (a.base_price ?? 0) - (b2.base_price ?? 0))
        .slice(0, 2)
        .map((s: any) => s._id);
      for (const service_id of topServiceIds) {
        items.push({ business_id: String(b._id), service_id });
      }
    }
    return items;
  }, [isServices, enrichedBusinesses, selectedDateKey]);
  const { data: batchSlots, isLoading: isLoadingSlots } =
    useGetBatchAvailableSlots(slotItems, selectedDateKey, timezone);
  const slotsByServiceId = batchSlots?.slots;
  const isLoading = isServices ? isLoadingBusinesses : isLoadingEvents;
  const service =
    searchParams.get("service") || searchParams.get("search") || "";
  const isNearMe =
    !searchParams.get("city") && refLat !== null && refLng !== null;
  const nearLabel =
    searchLocationMode === "mapArea" ? "in this map area" : "near you";
  const cityLabel = searchParams.get("city") ?? (isNearMe ? "" : "Australia");
  const resultCount = isServices ? businesses.length : events.length;
  const countText = isLoading
    ? "Loading…"
    : isServices
      ? `${businesses.length}${businesses.length === 0 ? "" : "+"} services ${isNearMe ? nearLabel : `in ${cityLabel}`}`
      : `${events.length}${events.length === 0 ? "" : "+"} events ${isNearMe ? nearLabel : `in ${cityLabel}`}`;

  /* ── Desktop toolbar row (segmented · count · Filters · Hide/Show map) ── */
  const ToolbarRow = () => (
    <div
      data-ui="results-toolbar-row"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "24px 0", background: "var(--background)" }}>
      <SegmentedControl listType={listType} onChange={setListType} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, minWidth: 0 }}>
        <p data-ui="results-count" style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "var(--muted-foreground)", textAlign: "right", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {countText}
        </p>
        <button data-ui="filters-button" onClick={() => setFiltersOpen(true)} style={outlineBtnStyle}>
          <SlidersVertical size={20} strokeWidth={1.75} style={{ margin: "0 -2px 0 -4px" }} />
          Filters
        </button>
        <button data-ui="map-toggle-button" onClick={() => setShowMap((v) => !v)} style={outlineBtnStyle}>
          <MapIcon size={20} strokeWidth={1.75} style={{ margin: "0 -2px 0 -4px" }} />
          <span className="lbl">{showMap ? "Hide map" : "Show map"}</span>
        </button>
      </div>
    </div>
  );

  /* ── Mobile compact top bar (spec/04 "Compact top bar") ── */
  const MobileTopBar = () => (
    <div data-ui="mobile-topbar" style={{ position: "fixed", inset: "0 0 auto 0", height: 148, background: mobileMapOpen ? "transparent" : "var(--background)", zIndex: 1000 }}>
      <div style={{ height: 84, padding: "20px 20px 0" }}>
        <div
          data-ui="mobile-search-pill"
          style={{
            position: "relative",
            height: 64,
            padding: 8,
            display: "grid",
            gridTemplateColumns: "48px minmax(0,1fr) 48px",
            gap: 4,
            alignItems: "center",
            borderRadius: 9999,
            background: "var(--background)",
            boxShadow: "0 2px 8px 0 rgba(var(--color-primary-rgb), .06)",
          }}>
          <span style={{ position: "absolute", inset: 0, border: "1px solid var(--border)", borderRadius: 9999, pointerEvents: "none" }} />
          <button
            data-ui="mobile-back-button"
            onClick={() => router.back()}
            aria-label="Go back"
            style={{ width: 48, height: 48, borderRadius: 9999, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--foreground)" }}>
            <ChevronLeft size={24} strokeWidth={1.75} />
          </button>
          <button onClick={() => setSearchOpen(true)} style={{ minWidth: 0, textAlign: "left", display: "flex", flexDirection: "column", border: "none", background: "transparent", cursor: "pointer" }}>
            <span data-ui="mobile-search-title" style={{ fontSize: 16, fontWeight: 600, lineHeight: "22px", letterSpacing: "-0.1px", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {service || "All services and events"}
            </span>
            <span data-ui="mobile-search-subtitle" style={{ fontSize: 14, lineHeight: "20px", color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Any time<span style={{ margin: "0 4px" }}>•</span>{isNearMe ? "Near you" : cityLabel}
            </span>
          </button>
          <button
            data-ui="mobile-map-toggle"
            onClick={() => setMobileMapOpen((v) => !v)}
            aria-label={mobileMapOpen ? "Show list" : "Show map"}
            style={{ width: 48, height: 48, borderRadius: 9999, border: "1px solid var(--border-strong)", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--foreground)" }}>
            {mobileMapOpen ? <ListIcon size={24} strokeWidth={1.75} /> : <MapIcon size={24} strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      <div data-ui="mobile-toolbar" style={{ height: 64, padding: "12px 20px 16px", display: "flex", alignItems: "center", gap: 8, overflowX: "auto", scrollbarWidth: "none" as const }} className="[&::-webkit-scrollbar]:hidden">
        <SegmentedControl listType={listType} onChange={setListType} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
          <button data-ui="mobile-time-button" aria-label="Any time" style={{ ...outlineBtnStyle, width: 36, padding: 0 }} className="min-[512px]:w-auto min-[512px]:px-[15px]">
            <CalendarClock size={20} strokeWidth={1.75} className="inline min-[512px]:hidden" />
            <span className="hidden min-[512px]:inline">Any time</span>
            <ChevronDown size={20} strokeWidth={1.75} className="hidden min-[512px]:inline" style={{ margin: "0 -4px 0 -2px" }} />
          </button>
          <button data-ui="filters-button" onClick={() => setFiltersOpen(true)} aria-label="Filters" style={{ ...outlineBtnStyle, width: 52, padding: 0 }}>
            <SlidersVertical size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Card grid ──
     `cols` drives desktop (2 with map, 3 in list-mode) via inline style —
     those only ever change from a JS toggle, never a CSS breakpoint.
     `compact` instead renders 1 col <768px / 2 cols 768-1023px via Tailwind,
     since both live inside the same "<1024" JS branch. */
  const CardGrid = ({ cols, compact }: { cols: number; compact?: boolean }) => {
    const gridClassName = compact ? "grid-cols-1 min-[768px]:grid-cols-2" : undefined;
    const gridStyle = compact
      ? { gap: "32px 40px" }
      : { gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: "32px 40px" };
    if (isLoading) {
      return (
        <div data-ui="results-grid" className={gridClassName ? `grid ${gridClassName}` : undefined} style={{ display: gridClassName ? undefined : "grid", ...gridStyle }}>
          {Array.from({ length: 4 }).map(
            (_, i) => (
              <div key={i}>
                <Skeleton style={{ aspectRatio: "16/9", borderRadius: 16, width: "100%" }} />
                <div style={{ marginTop: 10 }}>
                  <Skeleton style={{ height: 14, width: "65%", borderRadius: 7, marginBottom: 8 }} />
                  <Skeleton style={{ height: 12, width: "45%", borderRadius: 7 }} />
                </div>
              </div>
            ),
          )}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Search size={26} color="var(--muted-foreground)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>
            {service
              ? `No results for "${service}"`
              : isServices
                ? "No services found"
                : "No events found"}
          </div>
          <div style={{ fontSize: 14, color: "var(--muted-foreground)", maxWidth: 300 }}>
            {isServices
              ? "Try a different service, location, or clear your filters."
              : "Try a different event, location, or clear your filters."}
          </div>
        </div>
      );
    }

    return (
      <div
        data-ui="results-grid"
        className={gridClassName ? `grid ${gridClassName}` : undefined}
        style={{ display: gridClassName ? undefined : "grid", ...gridStyle, paddingBottom: 32 }}>
        {isServices
          ? enrichedBusinesses.map((b: any) => (
              <BusinessCard
                key={b._id}
                business={b}
                selectedDate={selectedDateKey}
                slotsByServiceId={slotsByServiceId}
                slotsLoading={isLoadingSlots}
              />
            ))
          : enrichedEvents.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
      </div>
    );
  };

  /* ── Map container ── */
  const MapBox = ({
    isVisible = true,
    fullScreen = false,
    hideControls = false,
    isExpanded = false,
    onExpandClick,
  }: {
    isVisible?: boolean;
    fullScreen?: boolean;
    hideControls?: boolean;
    isExpanded?: boolean;
    onExpandClick?: () => void;
  }) => (
    <div
      data-ui="map-panel"
      style={
        fullScreen
          ? { position: "fixed", inset: 0, borderRadius: 0, overflow: "hidden", background: "var(--muted)" }
          : { position: "fixed", top: 96, right: 24, bottom: 24, left: "min(60vw, 855px)", borderRadius: 12, overflow: "hidden", background: "var(--muted)" }
      }>
      <SearchMap
        activeType={listType}
        businesses={enrichedBusinesses}
        events={enrichedEvents}
        currentCity={searchParams.get("city") || ""}
        userLat={userLat ?? undefined}
        userLng={userLng ?? undefined}
        searchLocationMode={searchLocationMode}
        bounds={bounds}
        onBoundsChange={handleBoundsChange}
        isVisible={isVisible}
        hideControls={hideControls}
        isExpanded={isExpanded}
        onExpandClick={onExpandClick}
      />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <h1 className="sr-only">
        Local Businesses {isNearMe ? "Near You" : `in ${cityLabel}`}
      </h1>

      {/* ════════════ DESKTOP (>=1024) ════════════ */}
      <div className="hidden lg:block">
        {!isMapExpanded && (
          <main
            data-ui="results-column"
            style={{
              width: showMap ? "min(60vw, 855px)" : "100%",
              maxWidth: showMap ? undefined : 1288,
              margin: showMap ? undefined : "0 auto",
              padding: showMap ? "72px 32px 0" : "72px 32px 0",
            }}>
            <div data-ui="results-toolbar" style={{ position: "sticky", top: 72, zIndex: 10, background: "var(--background)", marginBottom: 24 }}>
              {ToolbarRow()}
              {isServices && (
                <DaySelector selected={selectedDate} onSelect={setSelectedDate} />
              )}
            </div>
            {CardGrid({ cols: showMap ? 2 : 3 })}
          </main>
        )}

        {showMap &&
          MapBox({
            isVisible: showMap,
            fullScreen: isMapExpanded,
            isExpanded: isMapExpanded,
            onExpandClick: () => setIsMapExpanded((v) => !v),
          })}
      </div>

      {/* ════════════ COMPACT (<1024) ════════════ */}
      <div className="lg:hidden">
        {MobileTopBar()}

        {!mobileMapOpen && (
          <main data-ui="results-column" style={{ padding: "148px 20px 0" }}>
            <div data-ui="results-toolbar" style={{ position: "sticky", top: 148, zIndex: 10, background: "var(--background)" }}>
              {isServices && (
                <div style={{ margin: "0 -20px" }}>
                  <div style={{ padding: "0 20px" }}>
                    <DaySelector selected={selectedDate} onSelect={setSelectedDate} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", padding: "16px 0", background: "var(--background)" }}>
              <p data-ui="results-count" style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "var(--muted-foreground)", margin: 0 }}>
                {countText}
              </p>
            </div>
            {CardGrid({ cols: 1, compact: true })}
          </main>
        )}

        {/* Full-screen map mode — always mounted, hidden via CSS rather than
           unmounted, so the map instance (position, zoom, selected marker)
           survives closing it. */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: mobileMapOpen ? 45 : -1,
            visibility: mobileMapOpen ? "visible" : "hidden",
            opacity: mobileMapOpen ? 1 : 0,
            pointerEvents: mobileMapOpen ? "auto" : "none",
          }}>
          {MapBox({ isVisible: mobileMapOpen, fullScreen: true, hideControls: true })}
        </div>
      </div>

      {/* Headless search drawer — opened when tapping the mobile search pill */}
      <div className="lg:hidden">
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
        resultCount={resultCount}
      />
    </div>
  );
}
