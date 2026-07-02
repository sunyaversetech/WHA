"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import LoginPage from "./LoginPage";
import SignupPage from "./Signup";
import BusinessSignupPage from "./BusinessSignupPage";
import { Button } from "../ui/button";

export default function AuthPage({ type }: { type: "user" | "business" }) {
  const params = useSearchParams();
  const router = useRouter();

  const currentTab = params.get("tab") === "signup" ? "signup" : "login";
  const isBusiness = type === "business";

  const heading =
    currentTab === "login"
      ? isBusiness
        ? "WHA for Business"
        : "WHA for Customers"
      : isBusiness
        ? "Create a business account"
        : "Create your account";

  const subheading =
    currentTab === "login"
      ? isBusiness
        ? "Log in to manage your bookings, services and team."
        : "Log in to book and manage your appointments."
      : isBusiness
        ? "Start listing your services and grow your customer base."
        : "Sign up to start booking local services.";

  const switchHref = isBusiness ? "/auth/user" : "/auth/business";
  const switchLabel = isBusiness
    ? "Looking for a customer account?"
    : "Have a business account?";
  const switchLinkText = isBusiness ? "WHA for Customers" : "WHA for Business";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      <div
        className="mt-8 md:mt-0"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0 24px",
          overflowY: "auto",
        }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div style={{ padding: "24px 0 10px" }}>
              <Button onClick={() => router.push("/auth")}>
                <ChevronLeft size={20} color="#0f172a" />
              </Button>
            </div>

            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}>
              {heading}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                margin: "0 0 32px",
                lineHeight: 1.5,
              }}>
              {subheading}
            </p>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
              <TabBtn
                active={currentTab === "login"}
                label="Log in"
                onClick={() =>
                  router.push(`/auth/${type}?tab=login`, { scroll: false })
                }
              />
              <span style={{ color: "#e2e8f0", alignSelf: "center" }}>·</span>
              <TabBtn
                active={currentTab === "signup"}
                label="Sign up"
                onClick={() =>
                  router.push(`/auth/${type}?tab=signup`, { scroll: false })
                }
              />
            </div>

            {currentTab === "login" ? (
              <LoginPage />
            ) : isBusiness ? (
              <BusinessSignupPage />
            ) : (
              <SignupPage />
            )}
          </div>
        </div>

        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <span style={{ fontSize: 14, color: "#64748b" }}>{switchLabel} </span>
          <a
            href={switchHref}
            style={{
              fontSize: 14,
              color: "#3b82f6",
              fontWeight: 600,
              textDecoration: "none",
            }}>
            {switchLinkText}
          </a>
        </div>
      </div>

      <div
        className="hidden md:block"
        style={{
          width: "46%",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Image
            src="/wha/wha-auth.png"
            alt="WH Australia"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        color: active ? "#0f172a" : "#94a3b8",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "4px 0",
        borderBottom: active ? "2px solid #0f172a" : "2px solid transparent",
      }}>
      {label}
    </button>
  );
}
