"use client";

import { X, MapPin, CalendarDays } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import L from "leaflet";
import LocationMap from "@/components/ResuableComponents/LocationSearch/LocationMap";
import { fmtDistance, haversineMetres } from "@/components/ResuableComponents/LocationSearch/geo";
import type { SearchLocationMode, Bounds } from "@/components/ResuableComponents/LocationSearch/useSearchLocation";
import { formatTime } from "@/components/Dashboard/Ticket/ticket-utils";

/* ── Fresha-style dark-pill event marker (mirrors the business rating pill,
   swapped for a pin icon since events don't carry a single rating value) ── */
export function makeEventMarkerIcon(selected: boolean): L.DivIcon {
  const bg = selected ? "#fff" : "#0f2748";
  const fg = selected ? "#0f2748" : "#fff";
  const border = selected ? "border:2px solid #0f2748;" : "";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:${fg};${border}border-radius:9999px;width:34px;height:34px;box-shadow:0 2px 10px rgba(2,12,26,0.22);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
    </div>`,
    iconAnchor: [17, 17],
  });
}

/* ── Event info popup card (mirrors BusinessMap's BusinessPopup) ── */
export function EventPopup({
  event,
  userLocation,
  onClose,
}: {
  event: any;
  userLocation: [number, number] | null;
  onClose: () => void;
}) {
  const slug = event.slug || event.title?.toLowerCase().replace(/[^a-z0-9]/g, "");

  let distText = "";
  if (typeof event.distance === "number") {
    distText = fmtDistance(event.distance);
  } else if (userLocation && event.latitude && event.longitude) {
    distText = fmtDistance(
      haversineMetres(
        userLocation[0],
        userLocation[1],
        Number(event.latitude),
        Number(event.longitude),
      ),
    );
  }

  const dateText = event.dateRange?.from
    ? `${new Date(event.dateRange.from).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" })}, ${formatTime(String(event.dateRange.from))}`
    : "Date TBA";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "min(340px, calc(100vw - 32px))",
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 12px 40px rgba(2,12,26,0.22)",
        overflow: "hidden",
        pointerEvents: "all",
      }}>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.92)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 1px 6px rgba(0,0,0,0.14)",
        }}>
        <X size={15} color="#0f2748" strokeWidth={2.5} />
      </button>

      <div style={{ position: "relative", height: 160, background: "#e9eef2" }}>
        <Image
          fill
          src={event.image || "/placeholder.svg"}
          alt={event.title || "Event"}
          style={{ objectFit: "cover" }}
          sizes="340px"
        />
      </div>

      <div style={{ padding: "14px 16px 16px" }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#0f2748",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
          {event.title}
        </span>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}>
          <CalendarDays size={13} color="#94a3b8" />
          {dateText}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            marginTop: 4,
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            alignItems: "center",
          }}>
          {distText && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <MapPin size={12} color="#94a3b8" />
              {distText}
            </span>
          )}
          {distText && event.venue && <span style={{ color: "#dde3ec" }}>·</span>}
          {event.venue && <span>{event.venue}</span>}
        </div>

        <Link
          href={`/events/${slug}`}
          style={{
            display: "block",
            marginTop: 12,
            background: "#051e3a",
            color: "#fff",
            textAlign: "center",
            padding: "11px",
            borderRadius: 11,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}>
          View event
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT — thin wrapper around the shared LocationMap engine,
   supplying only event-specific marker/popup rendering.
══════════════════════════════════════════════ */
export default function EventMap({
  businesses,
  currentCity,
  isVisible,
  isExpanded,
  onToggleExpand,
  userLat,
  userLng,
  searchLocationMode = "current",
  onBoundsChange,
}: {
  businesses: any[];
  currentCity: string;
  isVisible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  userLat?: number;
  userLng?: number;
  searchLocationMode?: SearchLocationMode;
  onBoundsChange?: (b: Bounds) => void;
}) {
  return (
    <LocationMap
      items={businesses}
      getId={(event: any) => event._id}
      getPosition={(event: any) =>
        event.latitude && event.longitude
          ? [Number(event.latitude), Number(event.longitude)]
          : null
      }
      renderMarkerIcon={(_event, selected) => makeEventMarkerIcon(selected)}
      renderPopup={(event, ctx) => (
        <EventPopup event={event} userLocation={ctx.userLocation} onClose={ctx.onClose} />
      )}
      currentCity={currentCity}
      userLat={userLat}
      userLng={userLng}
      searchLocationMode={searchLocationMode}
      onBoundsChange={onBoundsChange}
      showLocateButton
      isVisible={isVisible}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    />
  );
}
