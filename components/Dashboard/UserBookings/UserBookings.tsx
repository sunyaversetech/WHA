"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Ban,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingRecord {
  _id: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  total_price: number;
  currency: string;
  payment_status: string;
  business_id: string;
  notes?: string;
  service_id: { _id: string; name: string; base_price: number; base_duration: number } | null;
  employee_id: { _id: string; name: string } | null;
  business: { _id: string; business_name: string; image?: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  confirmed:   { bg: "#dcfce7", color: "#15803d", label: "Confirmed" },
  rescheduled: { bg: "#dbeafe", color: "#1d4ed8", label: "Rescheduled" },
  completed:   { bg: "#f1f5f9", color: "#475569", label: "Completed" },
  cancelled:   { bg: "#fee2e2", color: "#b91c1c", label: "Cancelled" },
  no_show:     { bg: "#fef3c7", color: "#92400e", label: "No Show" },
  refunded:    { bg: "#ede9fe", color: "#5b21b6", label: "Refunded" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
}
function isPast(iso: string) {
  return new Date(iso) < new Date();
}
function isActive(status: string) {
  return ["pending", "confirmed", "rescheduled"].includes(status);
}

// ─── Available Slots ──────────────────────────────────────────────────────────

function useAvailableSlots(
  serviceId: string,
  businessId: string,
  date: string,
  duration: number,
) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date || !serviceId) return;
    setSlots([]);
    setLoading(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch(
      `/api/bookings/available-slots?date=${date}&service_id=${serviceId}&business_id=${businessId}&timezone=${encodeURIComponent(tz)}&duration_minutes=${duration}`,
    )
      .then((r) => r.json())
      .then((d) => setSlots(d.available_slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date, serviceId, businessId, duration]);

  return { slots, loading };
}

// ─── Date Picker ──────────────────────────────────────────────────────────────

function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (d: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toISO = (day: number) =>
    `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div style={{ userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setMonth(new Date(year, mo - 1, 1))}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#64748b" }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
          {MONTH_NAMES[mo]} {year}
        </span>
        <button
          type="button"
          onClick={() => setMonth(new Date(year, mo + 1, 1))}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#64748b" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#94a3b8", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const iso = toISO(day);
          const date = new Date(year, mo, day);
          const past = date < today;
          const selected = iso === value;
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => onChange(iso)}
              style={{
                border: "none",
                borderRadius: 6,
                padding: "7px 0",
                fontSize: 13,
                cursor: past ? "not-allowed" : "pointer",
                background: selected ? "#0f172a" : "transparent",
                color: past ? "#cbd5e1" : selected ? "#fff" : "#0f172a",
                fontWeight: selected ? 700 : 400,
                transition: "background .1s",
              }}
              onMouseEnter={(e) => { if (!past && !selected) e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reschedule Modal ─────────────────────────────────────────────────────────

function RescheduleModal({
  booking,
  onClose,
  onDone,
}: {
  booking: BookingRecord;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [saving, setSaving] = useState(false);

  const duration = booking.service_id?.base_duration ?? booking.duration;
  const { slots, loading } = useAvailableSlots(
    booking.service_id?._id ?? "",
    booking.business_id,
    date,
    duration,
  );

  const confirm = async () => {
    if (!selectedSlot) return;
    setSaving(true);
    try {
      const start = new Date(selectedSlot);
      const end = new Date(start.getTime() + duration * 60_000);
      const res = await fetch(`/api/bookings/user/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reschedule");
      toast.success("Booking rescheduled successfully");
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        style={{
          background: "#fff", borderRadius: 20, padding: 28,
          width: "100%", maxWidth: 680,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Reschedule Booking</p>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              {booking.service_id?.name} · {fmtDuration(duration)}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Calendar */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Select Date</p>
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <DatePicker value={date} onChange={(d) => { setDate(d); setSelectedSlot(""); }} />
            </div>
          </div>

          {/* Slots */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              {date ? "Available Times" : "Pick a date first"}
            </p>
            {!date ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Select a date to see available slots</p>
              </div>
            ) : loading ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading slots…</p>
              </div>
            ) : slots.length === 0 ? (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "#94a3b8", fontSize: 13 }}>No available slots for this date</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 240, overflowY: "auto" }}>
                {slots.map((slot) => {
                  const selected = slot === selectedSlot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        border: selected ? "2px solid #0f172a" : "1.5px solid #e2e8f0",
                        borderRadius: 8,
                        padding: "10px 8px",
                        fontSize: 13,
                        fontWeight: selected ? 700 : 400,
                        background: selected ? "#0f172a" : "#fff",
                        color: selected ? "#fff" : "#0f172a",
                        cursor: "pointer",
                        transition: "all .1s",
                      }}>
                      {fmtTime(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "12px 24px", borderRadius: 9999, border: "1.5px solid #e2e8f0",
              background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedSlot || saving}
            onClick={confirm}
            style={{
              padding: "12px 24px", borderRadius: 9999, border: "none",
              background: !selectedSlot || saving ? "#94a3b8" : "#0f172a",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: !selectedSlot || saving ? "not-allowed" : "pointer",
              transition: "background .15s",
            }}>
            {saving ? "Saving…" : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onCancel,
  onReschedule,
}: {
  booking: BookingRecord;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const past = isPast(booking.start_time) || !isActive(booking.status);
  const style = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending;

  return (
    <div
      style={{
        border: "1.5px solid #e2e8f0",
        borderRadius: 16,
        padding: "20px 24px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
      {/* Row 1 — service + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {booking.service_id?.name ?? "Service"}
          </p>
          <p style={{ fontSize: 13, color: "#64748b", margin: "3px 0 0" }}>
            {booking.business?.business_name ?? "Business"}
          </p>
        </div>
        <span
          style={{
            background: style.bg, color: style.color,
            fontSize: 12, fontWeight: 600, borderRadius: 9999,
            padding: "4px 10px", whiteSpace: "nowrap", flexShrink: 0,
          }}>
          {style.label}
        </span>
      </div>

      {/* Row 2 — date / time / duration */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} color="#94a3b8" />
          <span style={{ fontSize: 13, color: "#475569" }}>{fmtDate(booking.start_time)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={14} color="#94a3b8" />
          <span style={{ fontSize: 13, color: "#475569" }}>
            {fmtTime(booking.start_time)} – {fmtTime(booking.end_time)}
          </span>
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          {fmtDuration(booking.duration)}
        </span>
      </div>

      {/* Row 3 — employee + price */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {booking.employee_id?.name ? `with ${booking.employee_id.name}` : ""}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
          ${booking.total_price.toFixed(2)} {booking.currency}
        </span>
      </div>

      {/* Row 4 — actions */}
      <div style={{ display: "flex", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
        {!past ? (
          <>
            <button
              type="button"
              onClick={onReschedule}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: "1.5px solid #e2e8f0", borderRadius: 9999, padding: "10px 0",
                background: "#fff", color: "#0f172a", fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "border-color .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}>
              <RefreshCw size={14} />
              Reschedule
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: "1.5px solid #fecaca", borderRadius: 9999, padding: "10px 0",
                background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "background .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
              <Ban size={14} />
              Cancel
            </button>
          </>
        ) : (
          <a
            href={`/businesses/${booking.business_id}`}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: "1.5px solid #e2e8f0", borderRadius: 9999, padding: "10px 0",
              background: "#0f172a", color: "#fff", fontSize: 13, fontWeight: 600,
              textDecoration: "none", transition: "background .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}>
            <ExternalLink size={14} />
            Book Again
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserBookings() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRecord | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/user");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load bookings");
      setBookings(data.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (b: BookingRecord) => {
    if (!confirm(`Cancel your booking for "${b.service_id?.name}"?`)) return;
    setCancellingId(b._id);
    try {
      const res = await fetch(`/api/bookings/user/${b._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.start_time) >= now && isActive(b.status),
  );
  const past = bookings.filter(
    (b) => new Date(b.start_time) < now || !isActive(b.status),
  );
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 0" }}>
      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>My Bookings</h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: "6px 0 0" }}>
          View and manage all your appointments
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 9, border: "none", cursor: "pointer",
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#0f172a" : "#64748b",
              fontWeight: tab === t ? 700 : 500, fontSize: 14,
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s",
            }}>
            {t === "upcoming" ? "Upcoming" : "Past"}{" "}
            <span style={{ fontWeight: 400, fontSize: 12, color: tab === t ? "#64748b" : "#94a3b8" }}>
              ({t === "upcoming" ? upcoming.length : past.length})
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                border: "1.5px solid #e2e8f0", borderRadius: 16, height: 160,
                background: "linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.2s infinite",
              }}
            />
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : displayed.length === 0 ? (
        <div
          style={{
            border: "1.5px dashed #e2e8f0", borderRadius: 16, padding: "48px 32px",
            textAlign: "center",
          }}>
          <Calendar size={40} color="#e2e8f0" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", margin: 0 }}>
            {tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </p>
          <p style={{ fontSize: 13, color: "#cbd5e1", margin: "8px 0 0" }}>
            {tab === "upcoming"
              ? "Book a service to get started"
              : "Your completed appointments will appear here"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {displayed.map((b) => (
            <BookingCard
              key={b._id}
              booking={b}
              onCancel={() => handleCancel(b)}
              onReschedule={() => setRescheduleTarget(b)}
            />
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onDone={() => {
            setRescheduleTarget(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}
