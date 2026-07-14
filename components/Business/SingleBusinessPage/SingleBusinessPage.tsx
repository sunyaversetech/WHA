"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  BadgeCheck,
  Star,
  Heart,
  Share2,
  MapPin,
  Loader2,
  Clock,
  User,
  Check,
} from "lucide-react";
import { useGetSingleBusiness } from "@/services/business.service";
import BusinessReviewSection from "@/components/Business/Comment";
import MapComponent from "./Map";
import { useGetReview } from "@/services/review.service";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Loading from "@/app/search/loading";
import BusinessHours from "./Hours";
import { useAuthModal } from "@/components/Auth/DialogLogin/use-auth-model";
import EventCard from "@/components/cards/event-card";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import DealCard from "@/components/cards/deal-card";
import EventDrawer from "./EventDrawer";
import DealDrawer from "./DealDrawer";
import ServiceBookingList from "./Bookings/Bookings";

/* ─────────────────── design tokens ─────────────────── */
const T = {
  navy: "#0f2748",
  navyDark: "#051e3a",
  blue: "#3771db",
  gray: "#64748b",
  lightGray: "#94a3b8",
  border: "#e9eef2",
  bg: "#f8fafc",
  white: "#fff",
};

/* ─────────────────── tiny helpers ─────────────────── */
function Divider({ my = 32 }: { my?: number }) {
  return (
    <div
      style={{
        height: 1,
        background: T.border,
        margin: `${my}px 0`,
      }}
    />
  );
}

function SecTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: T.navy,
          margin: 0,
        }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? "#f5b301" : T.border}
          color={i <= Math.round(rating) ? "#f5b301" : T.border}
        />
      ))}
    </div>
  );
}

function ActionBtn({
  onClick,
  children,
  ghost = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  ghost?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: ghost ? "rgba(255,255,255,0.9)" : T.bg,
        border: ghost ? "none" : `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}>
      {children}
    </button>
  );
}

function BookNowBtn({
  full = false,
  onClick,
}: {
  full?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: T.navyDark,
        color: T.white,
        border: "none",
        borderRadius: 10,
        padding: "12px 28px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        width: full ? "100%" : undefined,
        whiteSpace: "nowrap",
      }}>
      Book now
    </button>
  );
}

function RatingSummary({
  ratingNum,
  totalReviews,
  category,
}: {
  ratingNum: number | null;
  totalReviews: number;
  category: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
      }}>
      {ratingNum ? (
        <>
          <StarRow rating={ratingNum} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>
            {ratingNum.toFixed(1)}
          </span>
          <span style={{ fontSize: 14, color: T.gray }}>
            ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
          </span>
        </>
      ) : (
        <>
          <StarRow rating={0} />
          <span style={{ fontSize: 13, color: T.lightGray }}>
            No reviews yet
          </span>
        </>
      )}
      {category && (
        <>
          <span style={{ color: T.lightGray }}>·</span>
          <span
            style={{
              fontSize: 14,
              color: T.gray,
              textTransform: "capitalize",
            }}>
            {category}
          </span>
        </>
      )}
    </div>
  );
}

/* ─────────────────── new schedule display ─────────────────── */
const DAY_MAP: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function NewScheduleDisplay({
  schedule,
  is24_7,
}: {
  schedule: Record<string, any> | null;
  is24_7: boolean;
}) {
  const todayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    new Date().getDay()
  ];

  if (is24_7) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "#16a34a",
          fontWeight: 600,
          fontSize: 14,
        }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
          }}
        />
        Open 24 / 7
      </span>
    );
  }

  if (!schedule) {
    return (
      <p style={{ fontSize: 14, color: T.lightGray }}>Hours not available</p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {DAY_ORDER.map((key) => {
        const day = schedule[key] ?? { open: false, slots: [] };
        const isToday = key === todayKey;
        const slot = day.slots?.[0];
        return (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              fontWeight: isToday ? 700 : 400,
              color: isToday ? T.navy : T.gray,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: day.open ? "#22c55e" : T.border,
                  flexShrink: 0,
                }}
              />
              <span style={{ width: 90 }}>{DAY_MAP[key]}</span>
            </div>
            <span style={{ textAlign: "right" }}>
              {day.open && slot ? `${slot.from} – ${slot.to}` : "Closed"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TeamCircle({ emp }: { emp: any }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        width: 80,
      }}>
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: T.bg,
          border: `2px solid ${T.border}`,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        {emp.employee_photo ? (
          <Image
            fill
            src={emp.employee_photo}
            alt={emp.full_name}
            style={{ objectFit: "cover" }}
            sizes="68px"
          />
        ) : (
          <User size={28} color={T.lightGray} />
        )}
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.navy,
          textAlign: "center",
          lineHeight: 1.3,
          wordBreak: "break-word",
          maxWidth: 76,
        }}>
        {emp.full_name?.split(" ")[0] ?? "Staff"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function BusinessPage() {
  const { data, isLoading } = useGetSingleBusiness();
  const { mutate, isPending } = useCreateFavroite();
  const { onOpen } = useAuthModal();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const businessId = data?.data?._id;
  const slug = data?.data?.business_name
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const { data: reviews } = useGetReview(slug ?? "");
  const { data: userFavorites } = useGetUserFavroite();

  const [portfolioExpanded, setPortfolioExpanded] = useState(false);

  const isBusinessFavorite = userFavorites?.data?.business?.some(
    (item) => (item._id ?? "").toString() === businessId?.toString(),
  );

  const avgRating =
    reviews?.data && reviews.data.length > 0
      ? reviews.data.reduce((acc, r) => acc + r.rating, 0) / reviews.data.length
      : null;

  const totalReviews = reviews?.data?.length ?? 0;

  /* Extract unique team members from services */
  const teamMembers = useMemo(() => {
    const map = new Map<string, any>();
    data?.data?.services?.forEach((s: any) => {
      s.assigned_employees?.forEach((emp: any) => {
        if (emp?._id) map.set(emp._id, emp);
      });
    });
    return Array.from(map.values());
  }, [data?.data?.services]);

  const activeServices = useMemo(
    () => (data?.data?.services ?? []).filter((s: any) => s.is_active),
    [data?.data?.services],
  );

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: data?.data?.business_name ?? "Business",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied");
      }
    } catch {}
  };

  const handleFav = () => {
    if (!session) {
      onOpen();
      return;
    }
    mutate(
      { item_id: businessId, item_type: "User" },
      {
        onSuccess: (msg) => {
          router.refresh();
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => toast.error("Failed to update favourites"),
      },
    );
  };

  if (isLoading) return <Loading />;

  const biz = data?.data;
  const name = biz?.business_name ?? "Business";
  const category = biz?.business_category ?? "";
  const city =
    biz?.city === "other" ? (biz?.city_name ?? "") : (biz?.city ?? "");
  const address = biz?.location ?? "";
  const heroImg = biz?.image || "/placeholder.svg";
  const events = biz?.event ?? [];
  const deals = biz?.deal ?? [];
  const hasGeo = !!(biz?.latitude && biz?.longitude);

  const community: string[] = biz?.community ?? [];
  const venueImages: string[] = biz?.venue_images ?? [];
  const is24_7: boolean = biz?.is24_7 ?? false;
  const newSchedule = biz?.schedule ?? null;
  const businessType: string | null = biz?.business_type ?? null;
  const allImages = venueImages.length > 0 ? venueImages : [heroImg];

  const ratingNum = avgRating ? Number(avgRating.toFixed(1)) : null;

  const MainContent = () => (
    <div>
      {community.length > 0 && (
        <>
          <section style={{ marginBottom: 28 }}>
            <SecTitle>Community</SecTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {typeof community === "object" ? (
                community.map((c) => (
                  <span
                    key={c}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 9999,
                      background: "#eff6ff",
                      color: T.navy,
                      fontSize: 13,
                      fontWeight: 600,
                      border: `1px solid #dbeafe`,
                    }}>
                    {c}
                  </span>
                ))
              ) : (
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: 9999,
                    background: "#eff6ff",
                    color: T.navy,
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid #dbeafe`,
                  }}>
                  {community}
                </span>
              )}
            </div>
          </section>
          <Divider my={0} />
          <div style={{ height: 28 }} />
        </>
      )}

      <section>
        <SecTitle>
          Services
          {activeServices.length > 0 && (
            <span
              style={{
                fontSize: 13,
                color: T.gray,
                fontWeight: 500,
                marginLeft: 8,
              }}>
              {activeServices.length} available
            </span>
          )}
        </SecTitle>
        <ServiceBookingList services={biz?.services ?? []} />
      </section>

      {events.length > 0 && (
        <>
          <Divider />
          <section>
            <SecTitle>Events</SecTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}>
              {events.slice(0, 2).map((item: EventFormValues) => (
                <EventCard key={item._id} event={item} />
              ))}
            </div>
            {events.length > 2 && (
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <EventDrawer event={events} user={name} />
              </div>
            )}
          </section>
        </>
      )}

      {deals.length > 0 && (
        <>
          <Divider />
          <section>
            <SecTitle>Deals</SecTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}>
              {deals.slice(0, 2).map((item: any) => (
                <DealCard key={item._id} deal={item} />
              ))}
            </div>
            {deals.length > 2 && (
              <div style={{ marginTop: 14, textAlign: "center" }}>
                <DealDrawer deal={deals} user={name} />
              </div>
            )}
          </section>
        </>
      )}

      {/* TEAM */}
      {teamMembers.length > 0 && (
        <>
          <Divider />
          <section>
            <SecTitle
              action={
                <span
                  style={{
                    fontSize: 14,
                    color: T.blue,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}>
                  See all
                </span>
              }>
              Team
            </SecTitle>
            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 8,
                scrollbarWidth: "none",
              }}>
              {teamMembers.map((emp: any) => (
                <TeamCircle key={emp._id} emp={emp} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* REVIEWS */}
      <Divider />
      <section>
        {ratingNum && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 24,
              padding: "20px 24px",
              background: T.bg,
              borderRadius: 16,
              border: `1px solid ${T.border}`,
            }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: T.navy,
                  lineHeight: 1,
                }}>
                {ratingNum.toFixed(1)}
              </div>
              <div style={{ fontSize: 12, color: T.gray, marginTop: 4 }}>
                out of 5
              </div>
            </div>
            <div>
              <StarRow rating={ratingNum} size={24} />
              <div style={{ fontSize: 14, color: T.gray, marginTop: 6 }}>
                Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        )}
        <BusinessReviewSection reviews={reviews?.data || []} />
      </section>

      {/* VENUE PHOTOS / PORTFOLIO */}
      <Divider />
      <section>
        <SecTitle>
          {venueImages.length > 0 ? "Venue Photos" : "Portfolio"}
        </SecTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 4,
            borderRadius: 16,
            overflow: "hidden",
          }}>
          {venueImages.length > 0
            ? venueImages
                .slice(0, portfolioExpanded ? venueImages.length : 9)
                .map((src, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      aspectRatio: "1",
                      background: T.bg,
                      overflow: "hidden",
                    }}>
                    <Image
                      fill
                      src={src}
                      alt="Venue"
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 33vw, 200px"
                    />
                    {!portfolioExpanded &&
                      i === 8 &&
                      venueImages.length > 9 && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(2,12,26,0.55)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          onClick={() => setPortfolioExpanded(true)}>
                          <span
                            style={{
                              color: T.white,
                              fontSize: 22,
                              fontWeight: 800,
                            }}>
                            +{venueImages.length - 9}
                          </span>
                        </div>
                      )}
                  </div>
                ))
            : Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    background: T.bg,
                    overflow: "hidden",
                  }}>
                  <Image
                    fill
                    src={heroImg}
                    alt="Portfolio"
                    style={{
                      objectFit: "cover",
                      filter: i > 0 ? `brightness(${1 - i * 0.04})` : undefined,
                    }}
                    sizes="(max-width: 768px) 33vw, 200px"
                  />
                  {i === 8 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(2,12,26,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => setPortfolioExpanded(true)}>
                      <span
                        style={{
                          color: T.white,
                          fontSize: 22,
                          fontWeight: 800,
                          letterSpacing: "-0.5px",
                        }}>
                        +62
                      </span>
                    </div>
                  )}
                </div>
              ))}
        </div>
      </section>

      {/* OPENING TIMES + ADDITIONAL INFO */}
      <Divider />
      <section>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
          }}
          className="max-sm:grid-cols-1">
          {/* Opening times */}
          <div>
            <SecTitle>Opening times</SecTitle>
            {biz?.hours ? (
              <BusinessHours hours={biz.hours} open />
            ) : (
              <NewScheduleDisplay schedule={newSchedule} is24_7={is24_7} />
            )}
          </div>

          {/* Additional information */}
          <div>
            <SecTitle>Additional information</SecTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Accepts online bookings",
                "Instant confirmation",
                "Accepts card payments",
                biz?.verified ? "Verified business" : null,
                biz?.abn_number ? `ABN: ${biz.abn_number}` : null,
              ]
                .filter(Boolean)
                .map((item) => (
                  <div
                    key={item as string}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: T.navy,
                    }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#e8f5e9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                      <Check size={11} color="#2e7d32" strokeWidth={3} />
                    </div>
                    {item}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <Divider />
      <section style={{ paddingBottom: 40 }}>
        <SecTitle>Location</SecTitle>
        {hasGeo ? (
          <div style={{ borderRadius: 16, overflow: "hidden", height: 280 }}>
            <MapComponent
              latitude={biz.latitude}
              longitude={biz.longitude}
              business={biz}
            />
          </div>
        ) : (
          <div
            style={{
              height: 200,
              borderRadius: 16,
              background: T.bg,
              border: `1px dashed ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.lightGray,
              fontSize: 14,
            }}>
            No location available
          </div>
        )}
        {address && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 14,
            }}>
            <MapPin
              size={15}
              color={T.gray}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ fontSize: 14, color: T.gray }}>
              {address}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  color: T.blue,
                  fontWeight: 700,
                  textDecoration: "none",
                  marginTop: 4,
                  fontSize: 14,
                }}>
                Get directions
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  /* ═══════════════ STICKY SIDEBAR (desktop) ═══════════════ */
  const Sidebar = () => (
    <div
      style={{
        position: "sticky",
        top: 96,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        overflow: "hidden",
        background: T.white,
        boxShadow: "0 4px 32px rgba(2,12,26,0.08)",
      }}>
      {/* Identity */}
      <div style={{ padding: "24px 24px 0" }}>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: T.navy,
            lineHeight: 1.25,
            marginBottom: 4,
          }}>
          {name}
        </h3>
        {category && (
          <p
            style={{
              fontSize: 13,
              color: T.gray,
              textTransform: "capitalize",
              marginBottom: 10,
            }}>
            {category}
          </p>
        )}
        {ratingNum && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
            }}>
            <StarRow rating={ratingNum} size={13} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
              {ratingNum.toFixed(1)}
            </span>
            <span style={{ fontSize: 13, color: T.lightGray }}>
              ({totalReviews})
            </span>
          </div>
        )}
        <BookNowBtn
          full
          onClick={() => router.push(`/bookings?business_id=${businessId}`)}
        />
      </div>

      <div style={{ height: 1, background: T.border, margin: "20px 24px" }} />

      {/* Hours */}
      <div style={{ padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 12,
          }}>
          <Clock size={14} color={T.gray} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>
            Opening hours
          </span>
        </div>
        {biz?.hours ? (
          <BusinessHours hours={biz.hours} />
        ) : (
          <NewScheduleDisplay schedule={newSchedule} is24_7={is24_7} />
        )}
      </div>

      <div style={{ height: 1, background: T.border, margin: "20px 24px" }} />

      {/* Address */}
      {address && (
        <div style={{ padding: "0 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <MapPin
              size={14}
              color={T.gray}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <p style={{ fontSize: 13, color: T.gray, lineHeight: 1.5 }}>
                {address}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 13,
                  color: T.blue,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-block",
                  marginTop: 4,
                }}>
                Get directions
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mini map */}
      {hasGeo && (
        <div
          style={{
            height: 180,
            position: "relative",
            overflow: "hidden",
          }}>
          <MapComponent
            latitude={biz.latitude}
            longitude={biz.longitude}
            business={biz}
          />
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: T.white }}>
      {/* ══════════ MOBILE LAYOUT ══════════ */}
      <div className="md:hidden">
        {/* Full-bleed hero */}
        <div style={{ position: "relative", height: 300 }}>
          <Image
            fill
            src={heroImg}
            alt={name}
            style={{ objectFit: "cover" }}
            priority
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(2,12,26,0.5) 0%, transparent 60%)",
            }}
          />
          {/* Overlay controls */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "48px 16px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <ActionBtn onClick={() => router.back()} ghost>
              <ChevronLeft size={20} color={T.navy} />
            </ActionBtn>
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn onClick={handleShare} ghost>
                <Share2 size={17} color={T.navy} />
              </ActionBtn>
              <ActionBtn onClick={handleFav} ghost>
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" color={T.navy} />
                ) : (
                  <Heart
                    size={17}
                    color={isBusinessFavorite ? "#e11d48" : T.navy}
                    fill={isBusinessFavorite ? "#e11d48" : "none"}
                    strokeWidth={2}
                  />
                )}
              </ActionBtn>
            </div>
          </div>
        </div>

        {/* Mobile business info */}
        <div
          style={{
            padding: "20px 16px 8px",
            borderBottom: `1px solid ${T.border}`,
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: T.navy,
                    lineHeight: 1.2,
                    margin: 0,
                  }}>
                  {name}
                </h1>
                {biz?.verified && (
                  <BadgeCheck size={20} fill={T.blue} color={T.white} />
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                <RatingSummary
                  ratingNum={ratingNum}
                  totalReviews={totalReviews}
                  category={category}
                />
              </div>
              {(city || address) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 6,
                    fontSize: 13,
                    color: T.gray,
                  }}>
                  <MapPin size={13} color={T.gray} />
                  <span style={{ textTransform: "capitalize" }}>
                    {city || address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Book Now */}
          <div style={{ marginTop: 16, marginBottom: 4 }}>
            <BookNowBtn
              full
              onClick={() => router.push(`/bookings?business_id=${businessId}`)}
            />
          </div>
        </div>

        {/* Mobile sections */}
        <div style={{ padding: "24px 16px 80px" }}>{MainContent()}</div>
      </div>

      {/* ══════════ DESKTOP LAYOUT ══════════ */}
      <div className="hidden md:block">
        <div style={{ height: 80 }} />

        {/* ── HERO IMAGE GRID ── */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 32px",
          }}>
          {/* Top action row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
              marginBottom: 14,
            }}>
            <button
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: T.navy,
                cursor: "pointer",
              }}>
              <Share2 size={14} />
              Share
            </button>
            <button
              onClick={handleFav}
              disabled={isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: isBusinessFavorite ? "#e11d48" : T.navy,
                cursor: "pointer",
              }}>
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Heart
                  size={14}
                  fill={isBusinessFavorite ? "#e11d48" : "none"}
                  color={isBusinessFavorite ? "#e11d48" : T.navy}
                />
              )}
              {isBusinessFavorite ? "Saved" : "Save"}
            </button>
          </div>

          {/* Image grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.55fr 1fr",
              gridTemplateRows: "220px 220px",
              gap: 8,
              borderRadius: 20,
              overflow: "hidden",
              height: 448,
            }}>
            {/* Large main image spans both rows */}
            <div style={{ position: "relative", gridRow: "1 / 3" }}>
              <Image
                fill
                src={allImages[0]}
                alt={name}
                style={{ objectFit: "cover" }}
                priority
                sizes="(max-width: 1200px) 60vw, 720px"
              />
            </div>
            {/* Top-right small image */}
            <div style={{ position: "relative" }}>
              <Image
                fill
                src={allImages[1] ?? allImages[0]}
                alt={name}
                style={{ objectFit: "cover", filter: "brightness(0.92)" }}
                sizes="320px"
              />
            </div>
            {/* Bottom-right small image + "See all" */}
            <div style={{ position: "relative" }}>
              <Image
                fill
                src={allImages[2] ?? allImages[0]}
                alt={name}
                style={{ objectFit: "cover", filter: "brightness(0.82)" }}
                sizes="320px"
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(2,12,26,0.18)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "flex-end",
                  padding: 14,
                }}>
                <button
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: T.navy,
                    cursor: "pointer",
                  }}>
                  See all photos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── BUSINESS INFO BAR ── */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "24px 32px 0",
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
            }}>
            {/* Left: name + rating + location */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}>
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: T.navy,
                    lineHeight: 1.15,
                    margin: 0,
                  }}>
                  {name}
                </h1>
                {biz?.verified && (
                  <BadgeCheck size={26} fill={T.blue} color={T.white} />
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <RatingSummary
                  ratingNum={ratingNum}
                  totalReviews={totalReviews}
                  category={category}
                />
              </div>
              {businessType && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    marginTop: 8,
                    padding: "3px 10px",
                    borderRadius: 9999,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                  {businessType === "item_based"
                    ? "Item Booking"
                    : "Service Booking"}
                </span>
              )}
              {(city || address) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 7,
                    fontSize: 13,
                    color: T.gray,
                  }}>
                  <MapPin size={13} color={T.gray} />
                  <span style={{ textTransform: "capitalize" }}>{city}</span>
                  {city && address && (
                    <span style={{ color: T.border }}>·</span>
                  )}
                  <span>{address}</span>
                </div>
              )}
            </div>

            {/* Right: service count + book button */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 10,
                flexShrink: 0,
              }}>
              {activeServices.length > 0 && (
                <span style={{ fontSize: 13, color: T.gray, fontWeight: 500 }}>
                  {activeServices.length} services available
                </span>
              )}
              <BookNowBtn
                onClick={() =>
                  router.push(`/bookings?business_id=${businessId}`)
                }
              />
            </div>
          </div>

          {/* Thin divider */}
          <div style={{ height: 1, background: T.border, marginTop: 24 }} />
        </div>

        {/* ── 2-COLUMN CONTENT ── */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "36px 32px 80px",
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: 56,
            alignItems: "start",
          }}>
          {/* LEFT MAIN */}
          {MainContent()}

          {/* RIGHT SIDEBAR */}
          {Sidebar()}
        </div>
      </div>
    </div>
  );
}
