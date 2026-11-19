"use client";

const DAYS_SHOWN = 7;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelFor(d: Date, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
  }).format(d);
}

export default function DaySelector({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedKey = toDateKey(selected);

  const days = Array.from({ length: DAYS_SHOWN }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        overflowX: "auto",
        scrollbarWidth: "none" as const,
        marginBottom: 20,
        borderBottom: "1px solid #eef1f5",
      }}
      className="[&::-webkit-scrollbar]:hidden">
      {days.map((d, i) => {
        const key = toDateKey(d);
        const active = key === selectedKey;
        return (
          <button
            key={key}
            onClick={() => onSelect(d)}
            style={{
              flexShrink: 0,
              border: "none",
              borderBottom: active ? "2px solid #0f2748" : "2px solid transparent",
              background: "transparent",
              color: active ? "#0f2748" : "#64748b",
              fontWeight: active ? 700 : 500,
              fontSize: 14,
              padding: "0 2px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
            {labelFor(d, i)}
          </button>
        );
      })}
    </div>
  );
}
