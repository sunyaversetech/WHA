"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Smartphone } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import BusinessCard from "@/components/cards/business-card";
import EventCard from "@/components/cards/event-card";
import CardSlider from "@/components/ui/card-slider";
import BusinessSearchWithDates from "@/components/ResuableComponents/SearchSectionforBusiness";
import MobileBusinessSearchWithDates from "@/components/ResuableComponents/MobileViewSearch/SearchSectionforBusiness";
import { useGetLandingPageData } from "@/services/landing.service";
import { useFilteredBusinesses } from "@/hooks/use-filtered-data";
import LandingPageSkeleton from "./LandingPageSkeleton";

/* ══════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════ */
const REVIEWS = [
  {
    id: 1,
    title: "The best booking system",
    body: "Great experience, easy to book. Paying for treatments is so convenient — no cash or cards needed.",
    name: "Lucy",
    place: "London, UK",
  },
  {
    id: 2,
    title: "Easy to use & explore",
    body: "WHA's reminders make life so much easier. I also found a few good local spots I didn't know existed.",
    name: "Dan",
    place: "New York, USA",
  },
  {
    id: 3,
    title: "Great for finding businesses",
    body: "I've been using WHA for two years and it's by far the best booking platform I've used. Highly recommend it!",
    name: "Dale",
    place: "Sydney, Australia",
  },
];

const AU_CITY_COLS = [
  {
    heading: "Popular",
    links: [
      "Beauty Salons",
      "Eyebrows & Lashes",
      "Hair Salons",
      "Massages",
      "Waxing Salons",
      "Nail Salons",
      "Barbers",
    ],
  },
  {
    heading: "Sydney",
    links: [
      "Hair Salons in Sydney",
      "Nail Salons in Sydney",
      "Beauty Salons in Sydney",
      "Barbers in Sydney",
      "Massages in Sydney",
      "Eyebrows in Sydney",
      "Waxing in Sydney",
    ],
  },
  {
    heading: "Melbourne",
    links: [
      "Hair Salons in Melbourne",
      "Nail Salons in Melbourne",
      "Beauty Salons in Melbourne",
      "Barbers in Melbourne",
      "Massages in Melbourne",
      "Eyebrows in Melbourne",
      "Waxing in Melbourne",
    ],
  },
  {
    heading: "Brisbane",
    links: [
      "Hair Salons in Brisbane",
      "Nail Salons in Brisbane",
      "Beauty Salons in Brisbane",
      "Barbers in Brisbane",
      "Massages in Brisbane",
      "Eyebrows in Brisbane",
      "Waxing in Brisbane",
    ],
  },
];

const SERVICE_CHIPS = [
  "Beauty Salons",
  "Eyebrows & Lashes",
  "Nail Salons",
  "Hair Salons",
  "Massages",
  "Waxing Salons",
  "Medspas",
  "Barbers",
];

const FOOTER_COLS = [
  {
    heading: "About WHA",
    links: ["Careers", "Helpdesk support", "Blog", "Sitemap"],
  },
  {
    heading: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Terms of Use"],
  },
  {
    heading: "For Business",
    links: ["List your business", "Pricing", "Payments", "Support"],
  },
];

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/whatshappening_australia",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/whatshappeningaustralia",
  },
  { label: "Email", href: "mailto:info@whatshappeningaustralia.com" },
];

const CITY_LINKS = [
  "Sydney",
  "Melbourne",
  "Brisbane",
  "Perth",
  "Canberra",
  "Adelaide",
  "Hobart",
  "Darwin",
];

/* ══════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════ */

/* Star row */
function Stars({ n = 5, size = 18 }: { n?: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: n }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="#f5b301">
          <path d="M12 3.2l2.6 5.6 6 .5-4.5 4 1.3 5.9L12 16.7 6.6 19.2 7.9 13.3 3.4 9.3l6-.5z" />
        </svg>
      ))}
    </div>
  );
}

/* Section heading row with chevron nav (visual only) */
function SectionHeading({
  title,
  onPrev,
  onNext,
}: {
  title: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 22,
      }}>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#051e3a",
          margin: 0,
        }}>
        {title}
      </h2>
      <div style={{ display: "flex", gap: 10 }}>
        {[
          { dir: "prev", path: "M15 6l-6 6 6 6", onClick: onPrev },
          { dir: "next", path: "M9 6l6 6-6 6", onClick: onNext },
        ].map(({ dir, path, onClick }) => (
          <button
            key={dir}
            onClick={onClick}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "1px solid #e6ebf2",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#0f2748",
            }}>
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d={path} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/* 4-col responsive card grid */
function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="wha-cards"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 26,
      }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { data, isLoading } = useGetLandingPageData();
  const param = useSearchParams();
  const router = useRouter();
  const city = param.get("city") || "";
  const businesses = useFilteredBusinesses(data?.data.business || []);
  const events = data?.data.upcomingevents || [];
  const cityLabel = city || "Australia";

  if (isLoading) return <LandingPageSkeleton />;

  const slice = (arr: any[], from: number, to: number) => arr.slice(from, to);

  const goCity = (c: string) =>
    router.push(`/businesses?city=${encodeURIComponent(c)}`);
  const goService = (s: string) =>
    router.push(
      `/businesses?service=${encodeURIComponent(s.toLowerCase().replace(/ /g, "-"))}`,
    );

  return (
    <div style={{ background: "#ffffff", overflowX: "hidden" }}>
      <section
        style={{
          position: "relative",
          padding: "clamp(110px, 11vw, 140px) clamp(20px, 4vw, 56px) 70px",
          background:
            "radial-gradient(120% 120% at 50% -8%, #bad2f5 0%, #d4e7f8 16%, #e8f1fc 38%, #f4f8fd 60%, #ffffff 100%)",
          overflow: "visible",
          zIndex: 1,
        }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(32px, 5.6vw, 56px)",
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "#051e3a",
              margin: "0 0 18px",
            }}>
            What&apos;s Happening Australia
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 19px)",
              color: "#4a5a70",
              fontWeight: 500,
              margin: "0 auto 40px",
              maxWidth: 620,
            }}>
            Discover top-rated salons, barbers, medspas, wellness studios and
            beauty experts trusted by the South Asian community in Australia.
          </p>

          {/* Desktop search bar */}
          <div
            className="hidden md:block"
            style={{
              position: "relative",
              zIndex: 50,
              maxWidth: 1040,
              margin: "0 auto",
            }}>
            <BusinessSearchWithDates />
          </div>

          {/* Mobile: Fresha-style stacked search card */}
          <div className="md:hidden w-full">
            <MobileBusinessSearchWithDates variant="card" />
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#4a5a70",
              marginTop: 36,
            }}>
            409,216 appointments booked today
          </div>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              border: "1px solid #d8dfe9",
              background: "#fff",
              color: "#0f2748",
              fontWeight: 700,
              fontSize: 15,
              padding: "12px 22px",
              borderRadius: 9999,
              cursor: "pointer",
              marginTop: 20,
            }}>
            Get the app
            <Smartphone size={17} strokeWidth={2} />
          </button>
        </div>
      </section>

      {/* ═══════ PROMOTIONAL BANNER ═══════ */}
      <div
        style={{
          maxWidth: 1280,
          margin: "30px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <Link
          href="https://muktiandrevival.whaustralia.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(2,12,26,0.12)",
          }}>
          <div
            style={{
              position: "relative",
              aspectRatio: "21/8",
              background: "#0f2748",
            }}
            className="max-md:aspect-[10/5]">
            <Image
              fill
              src="/banner-img.png"
              alt="Featured promotion"
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
          </div>
        </Link>
      </div>

      {/* ═══════ CARD SECTIONS ═══════ */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "50px clamp(20px,4vw,56px) 0",
        }}>
        {businesses.length > 0 && (
          <section style={{ marginBottom: 54 }}>
            <SectionHeading
              title={`Businesses in ${cityLabel}`}
              onPrev={() => {}}
              onNext={() => {}}
            />
            <div className="hidden md:block">
              <CardGrid>
                {slice(businesses, 0, 4).map((b: any) => (
                  <BusinessCard key={b._id} business={b} />
                ))}
              </CardGrid>
            </div>
            <div className="md:hidden">
              <CardSlider viewAllHref="/businesses">
                {slice(businesses, 0, 6).map((b: any) => (
                  <BusinessCard key={b._id} business={b} />
                ))}
              </CardSlider>
            </div>
          </section>
        )}

        {/* More businesses (Trending) */}
        {businesses.length > 4 && (
          <section style={{ marginBottom: 54 }}>
            <SectionHeading
              title="Trending"
              onPrev={() => {}}
              onNext={() => {}}
            />
            <div className="hidden md:block">
              <CardGrid>
                {slice(businesses, 4, 8).map((b: any) => (
                  <BusinessCard key={b._id} business={b} />
                ))}
              </CardGrid>
            </div>
            <div className="md:hidden">
              <CardSlider viewAllHref="/businesses">
                {slice(businesses, 4, 10).map((b: any) => (
                  <BusinessCard key={b._id} business={b} />
                ))}
              </CardSlider>
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section style={{ marginBottom: 54 }}>
            <SectionHeading
              title={`Upcoming Events in ${cityLabel}`}
              onPrev={() => {}}
              onNext={() => {}}
            />
            <div className="hidden md:block">
              <CardGrid>
                {slice(events, 0, 4).map((e: any) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </CardGrid>
            </div>
            <div className="md:hidden">
              <CardSlider viewAllHref="/events">
                {slice(events, 0, 6).map((e: any) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </CardSlider>
            </div>
          </section>
        )}
      </div>

      {/* ═══════ APP DOWNLOAD ═══════ */}
      <section
        style={{
          maxWidth: 1280,
          margin: "60px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <div
          className="wha-2col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 40,
            alignItems: "center",
          }}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
                color: "#4a5a70",
                marginBottom: 22,
              }}>
              Available on
              {/* Apple */}
              <svg width={17} height={17} viewBox="0 0 24 24" fill="#0f2748">
                <path d="M16 2c.1 1.2-.4 2.4-1.1 3.3-.8.9-2 1.6-3.1 1.5-.1-1.2.4-2.4 1.1-3.2C13.7 2.6 15 2 16 2Zm3.5 7.4c-1.9-.1-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.7-1-1.9 0-3.7 1.1-4.6 2.8-2 3.4-.5 8.5 1.4 11.3.9 1.3 2 2.8 3.4 2.8 1.4-.1 1.9-.9 3.5-.9 1.6 0 2.1.9 3.5.9 1.5 0 2.4-1.4 3.3-2.7.6-.9 1.1-1.9 1.4-3-2.6-1-3.1-4.8-.3-6.3-.9-1.3-2.2-2.1-3.5-2.7Z" />
              </svg>
              {/* Android */}
              <svg
                width={17}
                height={17}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f2748"
                strokeWidth={2}>
                <circle cx={12} cy={12} r={9} />
                <path d="M12 3a9 9 0 0 0 0 18M12 3c2.5 2.3 4 5.6 4 9s-1.5 6.7-4 9" />
              </svg>
            </div>
            <h2
              style={{
                fontSize: "clamp(28px,4vw,42px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#051e3a",
                margin: "0 0 18px",
              }}>
              Download the
              <br />
              WHA app
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "#4a5a70",
                fontWeight: 500,
                maxWidth: 380,
                margin: "0 0 28px",
              }}>
              Book unforgettable beauty and wellness experiences with the WHA
              mobile app.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[
                {
                  label: "Google Play",
                  sub: "GET IT ON",
                  icon: (
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="#fff">
                      <path d="M3.6 2.4 14 12 3.6 21.6c-.4-.2-.6-.6-.6-1.1V3.5c0-.5.2-.9.6-1.1Zm11.6 8.4 2.6 2.6-2.6 2.6L12.6 12l2.6-2.6Z" />
                    </svg>
                  ),
                },
                {
                  label: "App Store",
                  sub: "Download on the",
                  icon: (
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="#fff">
                      <path d="M16 2c.1 1.2-.4 2.4-1.1 3.3-.8.9-2 1.6-3.1 1.5-.1-1.2.4-2.4 1.1-3.2C13.7 2.6 15 2 16 2Zm3.5 7.4c-1.9-.1-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.7-1-1.9 0-3.7 1.1-4.6 2.8-2 3.4-.5 8.5 1.4 11.3.9 1.3 2 2.8 3.4 2.8 1.4-.1 1.9-.9 3.5-.9 1.6 0 2.1.9 3.5.9 1.5 0 2.4-1.4 3.3-2.7.6-.9 1.1-1.9 1.4-3-2.6-1-3.1-4.8-.3-6.3-.9-1.3-2.2-2.1-3.5-2.7Z" />
                    </svg>
                  ),
                },
              ].map(({ label, sub, icon }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    background: "#051e3a",
                    color: "#fff",
                    borderRadius: 13,
                    padding: "12px 20px",
                    cursor: "pointer",
                  }}>
                  {icon}
                  <div style={{ lineHeight: 1.1 }}>
                    <div style={{ fontSize: 11, fontWeight: 500 }}>{sub}</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockups */}
          <div
            className="wha-phones"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 24,
              alignItems: "flex-start",
            }}>
            {[0, 46].map((mt, i) => (
              <div
                key={i}
                style={{
                  width: 240,
                  height: 480,
                  borderRadius: 36,
                  border: "9px solid #0f2748",
                  overflow: "hidden",
                  background: "linear-gradient(145deg,#eef0fb,#dde3ec)",
                  boxShadow: "0 30px 60px rgba(2,12,26,0.18)",
                  marginTop: mt,
                  flexShrink: 0,
                }}>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <span style={{ fontSize: 42, opacity: 0.3 }}>📱</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ REVIEWS ═══════ */}
      <section
        style={{
          maxWidth: 1180,
          margin: "90px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <div
          className="wha-3col"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}>
          {REVIEWS.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#f6f8fb",
                borderRadius: 20,
                padding: "30px 28px",
                display: "flex",
                flexDirection: "column",
              }}>
              <div style={{ marginBottom: 16 }}>
                <Stars />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0f2748",
                  marginBottom: 10,
                }}>
                {r.title}
              </div>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "#5a6a80",
                  fontWeight: 500,
                  margin: "0 0 26px",
                  flex: 1,
                }}>
                {r.body}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}>
                  {r.name.charAt(0)}
                </div>
                <div style={{ lineHeight: 1.3 }}>
                  <div
                    style={{ fontSize: 15, fontWeight: 700, color: "#0f2748" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 14, color: "#7c899c" }}>
                    {r.place}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section
        style={{
          maxWidth: 1280,
          margin: "96px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
          textAlign: "center",
        }}>
        <h2
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#051e3a",
            margin: "0 0 12px",
          }}>
          The top-rated destination for selfcare
        </h2>
        <p
          style={{
            fontSize: 17,
            color: "#4a5a70",
            fontWeight: 500,
            margin: "0 0 56px",
          }}>
          One platform. Trusted by the best in the selfcare industry.
        </p>
        <div
          className="wha-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}>
          {[
            {
              value: `${(data?.data?.business?.length ?? 0) + 130000}+`,
              label: "partner businesses",
            },
            { value: "120+", label: "countries using WHA" },
            { value: "1 billion+", label: "appointments booked on WHA" },
            { value: "450,000+", label: "stylists and professionals" },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: "clamp(28px,3.5vw,42px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#3771db",
                  lineHeight: 1,
                }}>
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "#4a5a70",
                  fontWeight: 600,
                  marginTop: 12,
                }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ WHA FOR BUSINESS ═══════ */}
      <section
        style={{
          maxWidth: 1280,
          margin: "96px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <div
          className="wha-2col"
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 48,
            alignItems: "center",
          }}>
          <div>
            <h2
              style={{
                fontSize: "clamp(28px,3.5vw,40px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                color: "#051e3a",
                margin: "0 0 18px",
              }}>
              WHA for business
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "#4a5a70",
                fontWeight: 500,
                maxWidth: 400,
                margin: "0 0 28px",
              }}>
              Supercharge your business with the top booking platform for salons
              and spas in Australia. Independently voted no.1 by industry
              professionals.
            </p>
            <Link href="/auth">
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#051e3a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 9999,
                  padding: "15px 28px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                }}>
                List your business
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>
            </Link>
            {/* Trustpilot */}
            <div style={{ marginTop: 40 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f2748" }}>
                Excellent 5/5
              </div>
              <div style={{ display: "flex", gap: 4, margin: "10px 0 8px" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      background: "#00b67a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 3,
                    }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 3.2l2.6 5.6 6 .5-4.5 4 1.3 5.9L12 16.7 6.6 19.2 7.9 13.3 3.4 9.3l6-.5z" />
                    </svg>
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 14, color: "#7c899c", fontWeight: 600 }}>
                Over 1,953 reviews on Trustpilot
              </div>
            </div>
          </div>

          {/* Dashboard placeholder */}
          <div
            style={{
              position: "relative",
              borderRadius: 22,
              overflow: "hidden",
              background: "linear-gradient(135deg,#eef0fb,#dde6f5)",
              height: 400,
              boxShadow: "0 30px 60px rgba(2,12,26,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <div style={{ textAlign: "center", color: "#7c899c" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                Dashboard Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ BROWSE BY CITY ═══════ */}
      <section
        style={{
          maxWidth: 1280,
          margin: "96px auto 0",
          padding: "0 clamp(20px,4vw,56px)",
        }}>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "#051e3a",
            margin: "0 0 28px",
          }}>
          Browse by City
        </h2>

        {/* City chips */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 40,
          }}>
          {CITY_LINKS.map((c, i) => (
            <button
              key={c}
              onClick={() => goCity(c)}
              style={{
                border: `1px solid ${i === 0 ? "#051e3a" : "#e6ebf2"}`,
                background: i === 0 ? "#051e3a" : "#fff",
                color: i === 0 ? "#fff" : "#475569",
                fontWeight: i === 0 ? 700 : 600,
                fontSize: 14,
                padding: "10px 20px",
                borderRadius: 9999,
                cursor: "pointer",
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* City / service columns */}
        <div
          className="wha-city"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 32,
          }}>
          {AU_CITY_COLS.map((col) => (
            <div key={col.heading}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f2748",
                  marginBottom: 18,
                }}>
                {col.heading}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {col.links.map((lk) => (
                  <span
                    key={lk}
                    onClick={() =>
                      router.push(
                        `/businesses?service=${encodeURIComponent(lk.toLowerCase().replace(/ /g, "-"))}`,
                      )
                    }
                    style={{
                      fontSize: 15,
                      color: "#5a6a80",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}>
                    {lk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Service chips */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 40,
            paddingTop: 36,
            borderTop: "1px solid #eef1f5",
          }}>
          {SERVICE_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => goService(chip)}
              style={{
                border: "1px solid #e6ebf2",
                background: "#fff",
                color: "#0f2748",
                fontWeight: 600,
                fontSize: 14,
                padding: "11px 20px",
                borderRadius: 9999,
                cursor: "pointer",
              }}>
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer
        style={{
          marginTop: 90,
          borderTop: "1px solid #eef1f5",
          padding: "54px clamp(20px,4vw,56px) 40px",
        }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Top footer grid */}
          <div
            className="wha-foot"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
              gap: 40,
              paddingBottom: 44,
              borderBottom: "1px solid #eef1f5",
            }}>
            {/* Brand */}
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 24,
                  letterSpacing: "-0.03em",
                  color: "#051e3a",
                  marginBottom: 20,
                }}>
                wha<span style={{ color: "#3771db" }}>.</span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#7c899c",
                  fontWeight: 500,
                  lineHeight: 1.6,
                  maxWidth: 240,
                }}>
                Connecting the South Asian community in Australia with trusted
                local businesses and services.
              </p>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0f2748",
                    marginBottom: 18,
                  }}>
                  {col.heading}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {col.links.map((lk) => (
                    <span
                      key={lk}
                      style={{
                        fontSize: 15,
                        color: "#5a6a80",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}>
                      {lk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Social + legal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
              paddingTop: 36,
            }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 15,
                    color: "#5a6a80",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}>
                  <svg
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                  {label}
                </a>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                fontSize: 14,
                color: "#94a3b8",
                fontWeight: 500,
              }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "pointer",
                }}>
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <circle cx={12} cy={12} r={9} />
                  <path d="M3 12h18M12 3a14 14 0 0 1 0 18A14 14 0 0 1 12 3Z" />
                </svg>
                English (AU)
              </span>
              <span>© 2026 WHA Inc.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav spacer */}
      <div className="md:hidden h-16" />

      {/* ── Responsive grid styles ── */}
      <style>{`
        @media (max-width: 1000px) {
          .wha-cards  { grid-template-columns: repeat(2, 1fr) !important; }
          .wha-city   { grid-template-columns: repeat(2, 1fr) !important; }
          .wha-stats  { grid-template-columns: repeat(2, 1fr) !important; }
          .wha-2col   { grid-template-columns: 1fr !important; gap: 36px !important; }
          .wha-3col   { grid-template-columns: 1fr !important; }
          .wha-foot   { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .wha-cards  { grid-template-columns: 1fr !important; }
          .wha-city   { grid-template-columns: 1fr !important; }
          .wha-foot   { grid-template-columns: 1fr !important; gap: 32px !important; }
          .wha-phones { flex-direction: column !important; align-items: center !important; }
        }
      `}</style>
    </div>
  );
}
