"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetBusinessDashboard,
  useGetDashboardData,
} from "@/services/dashboard.service";
import { format, parseISO } from "date-fns";
import {
  BarChart2,
  CalendarClock,
  History,
  TrendingUp,
  MoreVertical,
} from "lucide-react";

/* ─── helpers ─── */
function fmtDuration(start: string, end: string) {
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
}

/* ─── SVG line chart ─── */
function LineChart({
  data,
  color = "#3771db",
  secondary = "#10b981",
}: {
  data: { date: string; appointments: number; sales: number }[];
  color?: string;
  secondary?: string;
}) {
  if (!data.length) return null;
  const W = 420;
  const H = 140;
  const pad = { top: 10, right: 12, bottom: 28, left: 8 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxApt = Math.max(...data.map((d) => d.appointments), 1);
  const maxSales = Math.max(...data.map((d) => d.sales), 1);

  const xScale = (i: number) =>
    pad.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const yScale = (v: number, max: number) =>
    pad.top + innerH - (v / max) * innerH;

  const aptPath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.appointments, maxApt)}`,
    )
    .join(" ");
  const salesPath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.sales, maxSales)}`,
    )
    .join(" ");

  const aptAreaPath =
    aptPath +
    ` L ${xScale(data.length - 1)} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;
  const salesAreaPath =
    salesPath +
    ` L ${xScale(data.length - 1)} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="aptGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={secondary} stopOpacity={0.15} />
          <stop offset="100%" stopColor={secondary} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={pad.left + innerW}
          y1={pad.top + innerH * (1 - t)}
          y2={pad.top + innerH * (1 - t)}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      <path d={salesAreaPath} fill="url(#salesGrad)" />
      <path d={aptAreaPath} fill="url(#aptGrad)" />
      <path
        d={salesPath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={aptPath}
        fill="none"
        stroke={secondary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => (
        <text
          key={d.date}
          x={xScale(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize={9}
          fill="#9ca3af"
          fontFamily="sans-serif">
          {format(parseISO(d.date), "d MMM")}
        </text>
      ))}
      {data.map((d, i) => (
        <React.Fragment key={d.date + i}>
          <circle
            cx={xScale(i)}
            cy={yScale(d.sales, maxSales)}
            r={3}
            fill={color}
          />
          <circle
            cx={xScale(i)}
            cy={yScale(d.appointments, maxApt)}
            r={3}
            fill={secondary}
          />
        </React.Fragment>
      ))}
    </svg>
  );
}

/* ─── Card ─── */
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: "24px",
        ...style,
      }}>
      {children}
    </div>
  );
}

function CardHeader({
  title,
  subtitle,
  dots = false,
}: {
  title: string;
  subtitle?: string;
  dots?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
      }}>
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      {dots && (
        <button
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            padding: 2,
          }}>
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  text,
  sub,
}: {
  icon: React.ReactNode;
  text: string;
  sub: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 0",
        gap: 12,
      }}>
      <div style={{ color: "#d1d5db" }}>{icon}</div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#6b7280",
          margin: 0,
          textAlign: "center",
        }}>
        {text}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "#9ca3af",
          margin: 0,
          textAlign: "center",
          lineHeight: 1.5,
        }}>
        {sub}
      </p>
    </div>
  );
}

const statusStyle: Record<string, React.CSSProperties> = {
  confirmed: { background: "#d1fae5", color: "#065f46" },
  cancelled: { background: "#fee2e2", color: "#991b1b" },
  completed: { background: "#dbeafe", color: "#1e40af" },
  pending: { background: "#fef3c7", color: "#92400e" },
  booked: { background: "#ede9fe", color: "#5b21b6" },
  no_show: { background: "#f3f4f6", color: "#4b5563" },
  rescheduled: { background: "#fce7f3", color: "#9d174d" },
};

function StatusPill({ status }: { status: string }) {
  const s = statusStyle[status?.toLowerCase()] ?? {
    background: "#f3f4f6",
    color: "#4b5563",
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 9px",
        borderRadius: 9999,
        whiteSpace: "nowrap",
        textTransform: "capitalize",
        flexShrink: 0,
        ...s,
      }}>
      {status ?? "pending"}
    </span>
  );
}

/* ─── Booking row (shared by activity + today) ─── */
function BookingRow({
  b,
  showFullDate = true,
}: {
  b: any;
  showFullDate?: boolean;
}) {
  const dateNum = format(new Date(b.start_time), "d");
  const dateMon = format(new Date(b.start_time), "MMM");
  const dateStr = showFullDate
    ? format(new Date(b.start_time), "EEE, d MMM yyyy HH:mm")
    : format(new Date(b.start_time), "EEE HH:mm");

  const typeStr = b.booking_type ?? b.type ?? null;
  const durStr =
    b.start_time && b.end_time ? fmtDuration(b.start_time, b.end_time) : null;
  const empName = b.employee_id?.full_name ?? null;

  const subParts = [typeStr, durStr, empName ? `with ${empName}` : null].filter(
    Boolean,
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid #f3f4f6",
      }}>
      {/* Date column */}
      <div
        style={{
          width: 30,
          textAlign: "center",
          flexShrink: 0,
          paddingTop: 1,
        }}>
        <p
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#111827",
            margin: 0,
            lineHeight: 1,
          }}>
          {dateNum}
        </p>
        <p
          style={{
            fontSize: 10,
            color: "#9ca3af",
            margin: "2px 0 0",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}>
          {dateMon}
        </p>
      </div>

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Line 1: datetime + status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 3,
          }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{dateStr}</span>
          <StatusPill status={b.status ?? "pending"} />
        </div>
        {/* Line 2: service name */}
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
          {b.service_id?.name ?? "Service"}
        </p>
        {/* Line 3: type, duration, employee */}
        {subParts.length > 0 && (
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {subParts.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isBusiness = session?.user?.category === "business";

  const { data: bizData } = useGetBusinessDashboard();
  const { data: userData } = useGetDashboardData();

  useEffect(() => {
    if (session?.user?.category === "super-admin") router.push("/super-admin");
  }, [session, router]);

  if (status === "loading")
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid #e5e7eb",
            borderTopColor: "#3771db",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  if (status === "unauthenticated")
    return (
      <p style={{ color: "#ef4444", padding: 40, textAlign: "center" }}>
        Access Denied. Please log in.
      </p>
    );

  /* ── Business dashboard ─────────────────────────────────────────── */
  if (isBusiness) {
    const stats = bizData?.data?.dailyStats ?? [];
    const totalApt = bizData?.data?.totalAppointments ?? 0;
    const totalSales = bizData?.data?.totalSales ?? 0;
    const upcoming = bizData?.data?.upcomingBookings ?? [];
    const recent = bizData?.data?.recentBookings ?? [];
    const today = bizData?.data?.todayBookings ?? [];

    // Derive top services from recent bookings
    const serviceCounts = recent.reduce(
      (acc: Record<string, { name: string; count: number }>, b: any) => {
        const id = b.service_id?._id ?? b.service_id;
        const name = b.service_id?.name ?? "Unknown Service";
        if (!id) return acc;
        acc[id] = acc[id]
          ? { ...acc[id], count: acc[id].count + 1 }
          : { name, count: 1 };
        return acc;
      },
      {},
    );
    const topServices = (
      Object.values(serviceCounts) as { name: string; count: number }[]
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Derive top team members from recent bookings
    const empCounts = recent.reduce(
      (acc: Record<string, { name: string; count: number }>, b: any) => {
        const id = b.employee_id?._id ?? b.employee_id;
        const name = b.employee_id?.full_name ?? "Unknown";
        if (!id) return acc;
        acc[id] = acc[id]
          ? { ...acc[id], count: acc[id].count + 1 }
          : { name, count: 1 };
        return acc;
      },
      {},
    );
    const topTeam = (
      Object.values(empCounts) as { name: string; count: number }[]
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const calendarLink = (
      <Link
        href="/dashboard/calendar"
        style={{ color: "#3b82f6", textDecoration: "none" }}>
        calendar
      </Link>
    );

    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Recent sales ── */}
          <Card>
            <CardHeader title="Recent sales" subtitle="Last 7 days" dots />
            {stats.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={48} strokeWidth={1.2} />}
                text="No Sales Data"
                sub="Make some appointments for sales data to appear"
              />
            ) : (
              <>
                <p
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#111827",
                    margin: "0 0 4px",
                  }}>
                  A$ {totalSales.toFixed(2)}
                </p>
                <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    Appointments <b style={{ color: "#111827" }}>{totalApt}</b>
                  </span>
                </div>
                <LineChart data={stats} />
                <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                  {[
                    { color: "#3771db", label: "Sales" },
                    { color: "#10b981", label: "Appointments" },
                  ].map(({ color, label }) => (
                    <span
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "#6b7280",
                      }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* ── Upcoming appointments ── */}
          <Card>
            <CardHeader
              title="Upcoming appointments"
              subtitle="Next 7 days"
              dots
            />
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<BarChart2 size={48} strokeWidth={1.2} />}
                text="Your schedule is empty"
                sub="Make some appointments for schedule data to appear"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {upcoming.slice(0, 6).map((b: any) => (
                  <BookingRow key={b._id} b={b} showFullDate={false} />
                ))}
              </div>
            )}
          </Card>

          {/* ── Appointments activity ── */}
          <Card>
            <CardHeader title="Appointments activity" />
            {recent.length === 0 ? (
              <EmptyState
                icon={<History size={48} strokeWidth={1.2} />}
                text="No recent activity"
                sub={
                  <>Visit the {calendarLink} section to add some appointments</>
                }
              />
            ) : (
              <>
                <style>{`.apt-scroll::-webkit-scrollbar{display:none}`}</style>
                <div
                  className="apt-scroll"
                  style={{
                    maxHeight: 336,
                    overflowY: "auto",
                    msOverflowStyle: "none" as any,
                    scrollbarWidth: "none" as any,
                  }}>
                  {recent.map((b: any) => (
                    <BookingRow key={b._id} b={b} showFullDate />
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* ── Today's next appointments ── */}
          <Card>
            <CardHeader title="Today's next appointments" />
            {today.length === 0 ? (
              <EmptyState
                icon={<CalendarClock size={48} strokeWidth={1.2} />}
                text="No Appointments Today"
                sub={
                  <>Visit the {calendarLink} section to add some appointments</>
                }
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {today.map((b: any) => (
                  <BookingRow key={b._id} b={b} showFullDate={false} />
                ))}
              </div>
            )}
          </Card>

          {/* ── Top services ── */}
          <Card>
            <CardHeader title="Top services" />
            {topServices.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={48} strokeWidth={1.2} />}
                text="No sales this month"
                sub="Create some sales for sales data to appear"
              />
            ) : (
              <div>
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px",
                    padding: "0 0 8px",
                    borderBottom: "1px solid #e5e7eb",
                    marginBottom: 2,
                  }}>
                  {["Service", "This month", "Last month"].map((h) => (
                    <span
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        textAlign: h === "Service" ? "left" : "center",
                      }}>
                      {h}
                    </span>
                  ))}
                </div>
                {topServices.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 100px",
                      padding: "12px 0",
                      borderBottom:
                        i < topServices.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                      alignItems: "center",
                    }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#111827",
                        margin: 0,
                      }}>
                      {s.name}
                    </p>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                        textAlign: "center",
                      }}>
                      {s.count}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#9ca3af",
                        textAlign: "center",
                      }}>
                      0
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Top team member" />
            {topTeam.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={48} strokeWidth={1.2} />}
                text="No sales this month"
                sub="Create some sales for sales data to appear"
              />
            ) : (
              <div>
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 100px",
                    padding: "0 0 8px",
                    borderBottom: "1px solid #e5e7eb",
                    marginBottom: 2,
                  }}>
                  {["Team member", "This month", "Last month"].map((h) => (
                    <span
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        textAlign: h === "Team member" ? "left" : "center",
                      }}>
                      {h}
                    </span>
                  ))}
                </div>
                {topTeam.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 100px",
                      padding: "10px 0",
                      borderBottom:
                        i < topTeam.length - 1 ? "1px solid #f3f4f6" : "none",
                      alignItems: "center",
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#dbeafe",
                          color: "#1d4ed8",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#111827",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        {m.name}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                        textAlign: "center",
                      }}>
                      {m.count}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "#9ca3af",
                        textAlign: "center",
                      }}>
                      0
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  /* ── User dashboard ─────────────────────────────────────────────── */
  const favorite = userData?.data?.favorite ?? [];
  const deals = userData?.data?.deals ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 24,
          color: "#111827",
        }}>
        Welcome back, {session?.user?.name ?? "there"}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Favourites" />
          {favorite.length === 0 ? (
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              No saved favourites yet.
            </p>
          ) : (
            favorite.map((item: any) => (
              <div
                key={item._id}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}>
                  {item?.item_id?.title}
                </p>
              </div>
            ))
          )}
        </Card>
        <Card>
          <CardHeader title="Deals to Redeem" />
          {deals.length === 0 ? (
            <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
              No pending deals.
            </p>
          ) : (
            deals.map((item: any) => (
              <div
                key={item._id}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}>
                  {item?.deal?.title}
                </p>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
