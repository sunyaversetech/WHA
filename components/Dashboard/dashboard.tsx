"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetBusinessDashboard } from "@/services/dashboard.service";
import { useGetDashboardData } from "@/services/dashboard.service";
import { format, parseISO } from "date-fns";
import { BarChart2, CalendarClock } from "lucide-react";

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

  const xScale = (i: number) => pad.left + (i / (data.length - 1)) * innerW;
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
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
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
      {action}
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
  sub: string;
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
      <div style={{ color: "#d1d5db", fontSize: 48 }}>{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#6b7280", margin: 0 }}>
        {text}
      </p>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{sub}</p>
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

  /* ── Business dashboard ── */
  if (isBusiness) {
    const stats = bizData?.data?.dailyStats ?? [];
    const totalApt = bizData?.data?.totalAppointments ?? 0;
    const totalSales = bizData?.data?.totalSales ?? 0;
    const upcoming = bizData?.data?.upcomingBookings ?? [];
    const recent = bizData?.data?.recentBookings ?? [];
    const today = bizData?.data?.todayBookings ?? [];

    return (
      <div>
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
          style={{ display: "grid", gap: 20 }}>
          {/* Recent sales */}
          <Card>
            <CardHeader
              title="Recent sales"
              subtitle="Last 7 days"
              action={
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: 18,
                  }}>
                  ···
                </button>
              }
            />
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
              <span
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
                    background: "#3771db",
                    flexShrink: 0,
                  }}
                />
                Sales
              </span>
              <span
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
                    background: "#10b981",
                    flexShrink: 0,
                  }}
                />
                Appointments
              </span>
            </div>
          </Card>

          {/* Upcoming appointments */}
          <Card>
            <CardHeader
              title="Upcoming appointments"
              subtitle="Next 7 days"
              action={
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: 18,
                  }}>
                  ···
                </button>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<BarChart2 size={48} strokeWidth={1} />}
                text="Your schedule is empty"
                sub="Make some appointments for schedule data to appear"
              />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {upcoming.slice(0, 6).map((b: any) => (
                  <div
                    key={b._id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}>
                    <div
                      style={{ width: 38, textAlign: "center", flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#111827",
                          margin: 0,
                        }}>
                        {format(new Date(b.start_time), "d")}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: "#9ca3af",
                          margin: 0,
                          textTransform: "uppercase",
                        }}>
                        {format(new Date(b.start_time), "MMM")}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                          margin: 0,
                        }}>
                        {b.service_id?.name ?? "Service"}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          margin: "2px 0 0",
                        }}>
                        {format(new Date(b.start_time), "h:mm a")} ·{" "}
                        {b.user_id?.name ?? "Client"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Appointments activity */}
          <Card>
            <CardHeader title="Appointments activity" />
            {recent.length === 0 ? (
              <EmptyState
                icon={<CalendarClock size={48} strokeWidth={1} />}
                text="No recent appointments"
                sub="Your booking activity will appear here"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recent.slice(0, 8).map((b: any) => (
                  <div
                    key={b._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: "1px solid #f3f4f6",
                    }}>
                    <div
                      style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#3771db",
                          margin: 0,
                        }}>
                        {format(new Date(b.start_time), "d")}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: "#9ca3af",
                          margin: 0,
                          textTransform: "uppercase",
                        }}>
                        {format(new Date(b.start_time), "MMM")}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                          margin: 0,
                        }}>
                        {format(
                          new Date(b.start_time),
                          "EEE, d MMM yyyy HH:mm",
                        )}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          margin: "2px 0 0",
                        }}>
                        {b.service_id?.name ?? "Service"} ·{" "}
                        {b.user_id?.name ?? "Client"}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 9999,
                        background:
                          b.status === "confirmed"
                            ? "#d1fae5"
                            : b.status === "cancelled"
                              ? "#fee2e2"
                              : "#fef3c7",
                        color:
                          b.status === "confirmed"
                            ? "#065f46"
                            : b.status === "cancelled"
                              ? "#991b1b"
                              : "#92400e",
                      }}>
                      {b.status ?? "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Today's next appointments */}
          <Card>
            <CardHeader title="Today's next appointments" />
            {today.length === 0 ? (
              <EmptyState
                icon={<CalendarClock size={48} strokeWidth={1} />}
                text="No Appointments Today"
                sub="Check back when you have bookings scheduled"
              />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {today.map((b: any) => (
                  <div
                    key={b._id}
                    style={{
                      background: "#f5f3ff",
                      border: "1px solid #ddd6fe",
                      borderRadius: 12,
                      padding: "12px 16px",
                    }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                        margin: "0 0 2px",
                      }}>
                      {b.service_id?.name ?? "Service"}
                    </p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                      {format(new Date(b.start_time), "h:mm a")} –{" "}
                      {format(new Date(b.end_time), "h:mm a")} ·{" "}
                      {b.user_id?.name ?? "Client"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  /* ── User dashboard ── */
  const favorite = userData?.data?.favorite ?? [];
  const deals = userData?.data?.deals ?? [];

  return (
    <div style={{ maxWidth: 900 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 24,
          color: "#111827",
        }}>
        Welcome back, {session?.user?.name ?? "there"}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
