"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { X, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ── AU city centre lookup ── */
const CITY_COORDS: Record<string, [number, number]> = {
  sydney: [-33.8688, 151.2093],
  melbourne: [-37.8136, 144.9631],
  brisbane: [-27.4698, 153.0251],
  perth: [-31.9505, 115.8605],
  adelaide: [-34.9285, 138.6007],
  canberra: [-35.2809, 149.13],
  hobart: [-42.8821, 147.3272],
  darwin: [-12.4634, 130.8456],
};
const AU_CENTRE: [number, number] = [-25.27, 133.77];
const AU_ZOOM = 5;

/* ── Helpers ── */
function fmtDistance(metres: number): string {
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
}

/* ── Fresha-style dark-pill business marker ── */
function makeMarkerIcon(rating: string | null, selected: boolean): L.DivIcon {
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

/* ── Blue pulsing user-location dot ── */
function makeUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:18px;height:18px;">
      <style>@keyframes wha-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.6);opacity:0}}</style>
      <div style="position:absolute;inset:-6px;background:rgba(66,133,244,0.22);border-radius:50%;animation:wha-pulse 1.8s ease-out infinite;"></div>
      <div style="position:absolute;inset:0;background:#4285f4;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(66,133,244,0.5);"></div>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/* ── Auto-fit bounds to businesses + user ── */
function BoundsUpdater({
  businesses,
  userLocation,
  city,
}: {
  businesses: any[];
  userLocation: [number, number] | null;
  city: string;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 400);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const pts: [number, number][] = [];
    if (userLocation) pts.push(userLocation);
    businesses.forEach((b) => {
      if (b.latitude && b.longitude)
        pts.push([Number(b.latitude), Number(b.longitude)]);
    });

    const timer = setTimeout(() => {
      try {
        if (pts.length === 0) {
          const centre = city ? CITY_COORDS[city.toLowerCase().trim()] : null;
          map.flyTo(centre ?? AU_CENTRE, centre ? 12 : AU_ZOOM, { duration: 1 });
          return;
        }
        if (pts.length === 1) {
          map.flyTo(pts[0], 14, { duration: 1 });
          return;
        }
        map.fitBounds(L.latLngBounds(pts), {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
          duration: 1,
        } as any);
      } catch (_) {}
    }, 500);

    return () => clearTimeout(timer);
  }, [businesses, userLocation, city, map]);

  return null;
}

/* ── Business info popup card ── */
function BusinessPopup({
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
          business.reviews.reduce(
            (acc: number, r: any) => acc + r.rating,
            0,
          ) / business.reviews.length
        ).toFixed(1)
      : null;

  let distText = "";
  if (typeof business.distance === "number") {
    distText = fmtDistance(business.distance);
  } else if (
    userLocation &&
    business.latitude &&
    business.longitude
  ) {
    const R = 6371000;
    const dLat =
      (Number(business.latitude) - userLocation[0]) * (Math.PI / 180);
    const dLng =
      (Number(business.longitude) - userLocation[1]) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(userLocation[0] * (Math.PI / 180)) *
        Math.cos(Number(business.latitude) * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    distText = fmtDistance(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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
      }}
    >
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
        }}
      >
        <X size={15} color="#0f2748" strokeWidth={2.5} />
      </button>

      {/* Image */}
      <div
        style={{ position: "relative", height: 160, background: "#e9eef2" }}
      >
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
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f2748",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
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
              }}
            >
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
          }}
        >
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
          }}
        >
          View profile
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function BusinessMap({
  businesses,
  currentCity,
  isVisible,
  isExpanded,
  onToggleExpand,
  userLat,
  userLng,
}: {
  businesses: any[];
  currentCity: string;
  isVisible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  userLat?: number;
  userLng?: number;
}) {
  const userLocation: [number, number] | null =
    userLat != null && userLng != null ? [userLat, userLng] : null;

  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

  // Memoised icons (Leaflet DivIcons are cheap but stable refs prevent re-renders)
  const userIcon = useMemo(() => makeUserIcon(), []);

  const handleMarkerClick = (business: any) => {
    setSelectedBusiness((prev: any) =>
      prev?._id === business._id ? null : business,
    );
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={AU_CENTRE}
        zoom={AU_ZOOM}
        zoomControl={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", position: "absolute" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <BoundsUpdater
          businesses={businesses}
          userLocation={userLocation}
          city={currentCity}
        />

        {/* User location blue dot */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon} />
        )}

        {/* Business markers */}
        {businesses.map((business: any) => {
          if (!business.latitude || !business.longitude) return null;

          const avgRating =
            business.reviews?.length > 0
              ? (
                  business.reviews.reduce(
                    (acc: number, r: any) => acc + r.rating,
                    0,
                  ) / business.reviews.length
                ).toFixed(1)
              : null;

          const isSelected = selectedBusiness?._id === business._id;

          return (
            <Marker
              key={business._id}
              position={[
                Number(business.latitude),
                Number(business.longitude),
              ]}
              icon={makeMarkerIcon(avgRating, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => handleMarkerClick(business),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Fresha-style business popup card */}
      {selectedBusiness && (
        <BusinessPopup
          business={selectedBusiness}
          userLocation={userLocation}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </div>
  );
}
