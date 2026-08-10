"use client";

import { X, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import L from "leaflet";
import LocationMap from "@/components/ResuableComponents/LocationSearch/LocationMap";
import { fmtDistance, haversineMetres } from "@/components/ResuableComponents/LocationSearch/geo";
import type { SearchLocationMode, Bounds } from "@/components/ResuableComponents/LocationSearch/useSearchLocation";

/* ── Fresha-style dark-pill business marker ── */
export function makeMarkerIcon(rating: string | null, selected: boolean): L.DivIcon {
  const bg = selected ? "#fff" : "#0f2748";
  const fg = selected ? "#0f2748" : "#fff";
  const border = selected ? "border:2px solid #0f2748;" : "";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:${fg};${border}border-radius:9999px;padding:6px 11px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 10px rgba(2,12,26,0.22);display:inline-flex;align-items:center;gap:3px;font-family:system-ui,-apple-system,sans-serif;cursor:pointer;transition:all .15s;">
      <span style="color:#f5b301;font-size:11px;">★</span>${rating ?? "·"}
    </div>`,
    iconAnchor: [28, 18],
  });
}

/* ── Business info popup card ── */
export function BusinessPopup({
  business,
  userLocation,
  onClose,
}: {
  business: any;
  userLocation: [number, number] | null;
  onClose: () => void;
}) {
  const slug =
    business.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

  const avgRating =
    business.reviews?.length > 0
      ? (
          business.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
          business.reviews.length
        ).toFixed(1)
      : null;

  let distText = "";
  if (typeof business.distance === "number") {
    distText = fmtDistance(business.distance);
  } else if (userLocation && business.latitude && business.longitude) {
    distText = fmtDistance(
      haversineMetres(
        userLocation[0],
        userLocation[1],
        Number(business.latitude),
        Number(business.longitude),
      ),
    );
  }

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
      {/* Close */}
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

      {/* Image */}
      <div style={{ position: "relative", height: 160, background: "#e9eef2" }}>
        <Image
          fill
          src={business.image || "/placeholder.svg"}
          alt={business.business_name || "Business"}
          style={{ objectFit: "cover" }}
          sizes="340px"
        />
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f2748",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {business.business_name}
          </span>
          {avgRating && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 13,
                fontWeight: 700,
                color: "#0f2748",
                flexShrink: 0,
              }}>
              <Star size={13} fill="#f5b301" color="#f5b301" />
              {avgRating}
            </span>
          )}
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
          {distText && <span>{distText}</span>}
          {distText && business.business_category && (
            <span style={{ color: "#dde3ec" }}>·</span>
          )}
          {business.business_category && (
            <span style={{ textTransform: "capitalize" }}>
              {business.business_category}
            </span>
          )}
          {business.reviews?.length > 0 && (
            <>
              <span style={{ color: "#dde3ec" }}>·</span>
              <span>{business.reviews.length} reviews</span>
            </>
          )}
        </div>

        <Link
          href={`/businesses/${slug}`}
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
          View profile
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT — thin wrapper around the shared LocationMap engine,
   supplying only business-specific marker/popup rendering.
══════════════════════════════════════════════ */
export default function BusinessMap({
  businesses,
  currentCity,
  userLat,
  userLng,
  searchLocationMode = "current",
  onBoundsChange,
}: {
  businesses: any[];
  currentCity: string;
  userLat?: number;
  userLng?: number;
  searchLocationMode?: SearchLocationMode;
  onBoundsChange?: (b: Bounds) => void;
}) {
  return (
    <LocationMap
      items={businesses}
      getId={(business: any) => business._id}
      getPosition={(business: any) =>
        business.latitude && business.longitude
          ? [Number(business.latitude), Number(business.longitude)]
          : null
      }
      renderMarkerIcon={(business: any, selected) => {
        const avgRating =
          business.reviews?.length > 0
            ? (
                business.reviews.reduce(
                  (acc: number, r: any) => acc + r.rating,
                  0,
                ) / business.reviews.length
              ).toFixed(1)
            : null;
        return makeMarkerIcon(avgRating, selected);
      }}
      renderPopup={(business, ctx) => (
        <BusinessPopup
          business={business}
          userLocation={ctx.userLocation}
          onClose={ctx.onClose}
        />
      )}
      currentCity={currentCity}
      userLat={userLat}
      userLng={userLng}
      searchLocationMode={searchLocationMode}
      onBoundsChange={onBoundsChange}
    />
  );
}
