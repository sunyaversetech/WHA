"use client";

// fresha-search-kit/spec/04 "Date rail". `null` = "Any day" (the default —
// no date filter applied, so the batched slots query stays disabled).

const DAYS_SHOWN = 14;

export function toDateKey(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelFor(d: Date, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric" }).format(d);
}

export default function DaySelector({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (date: Date | null) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedKey = selected ? toDateKey(selected) : "any";

  const days = Array.from({ length: DAYS_SHOWN }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const itemStyle = (active: boolean): React.CSSProperties => ({
    position: "relative",
    flexShrink: 0,
    border: "none",
    background: "transparent",
    height: 32,
    padding: "0 0 12px",
    display: "flex",
    alignItems: "flex-start",
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    lineHeight: "20px",
    color: active ? "var(--foreground)" : "var(--muted-foreground)",
    whiteSpace: "nowrap",
    cursor: "pointer",
  });

  return (
    <div style={{ position: "relative", boxShadow: "var(--shadow-rail)" }}>
      <nav
        data-ui="date-rail"
        aria-label="Availability"
        style={{
          display: "flex",
          gap: 24,
          height: 32,
          overflowX: "auto",
          scrollbarWidth: "none" as const,
        }}
        className="[&::-webkit-scrollbar]:hidden">
        <button data-ui="date-rail-item" onClick={() => onSelect(null)} style={itemStyle(selectedKey === "any")}>
          Any day
          {selectedKey === "any" && (
            <span
              data-ui="date-rail-indicator"
              style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, borderRadius: 16, background: "var(--primary)" }}
            />
          )}
        </button>
        {days.map((d, i) => {
          const key = toDateKey(d);
          const active = key === selectedKey;
          return (
            <button key={key} data-ui="date-rail-item" onClick={() => onSelect(d)} style={itemStyle(active)}>
              {labelFor(d, i)}
              {active && (
                <span
                  data-ui="date-rail-indicator"
                  style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, borderRadius: 16, background: "var(--primary)" }}
                />
              )}
            </button>
          );
        })}
        <span style={{ flexShrink: 0, width: 1, height: 24, alignSelf: "center", background: "var(--border)" }} />
        {/* TODO(ui-only): wire up a full date picker — no logic exists yet
           for picking a date beyond this 14-day rail. */}
        <button data-ui="date-rail-item" style={{ ...itemStyle(false), color: "var(--muted-foreground)" }} disabled>
          Choose date
        </button>
      </nav>
      <span
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 48,
          height: 32,
          background: "linear-gradient(to left, var(--background), rgba(255,255,255,0))",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
