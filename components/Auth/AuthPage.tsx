"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import LoginPage from "./LoginPage";
import AuthSelectionPage from "./AuthSelectionPage";

export default function AuthPage() {
  const params = useSearchParams();
  const router = useRouter();

  const currentTab = params.get("tab") === "signup" ? "signup" : "login";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      {/* ── Left panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0 24px",
          overflowY: "auto",
        }}>
        {/* Back arrow */}
        <div style={{ padding: "24px 0 0" }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}>
            <ChevronLeft size={20} color="#0f172a" />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div style={{ width: "100%", maxWidth: 400 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}>
              WH Australia
              {currentTab === "signup" ? " — Sign up" : " for customers"}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                margin: "0 0 36px",
                lineHeight: 1.5,
              }}>
              {currentTab === "signup"
                ? "Create an account to start booking services or start listing your services as a business"
                : "Login to book and manage your appointments or list your services as a business"}
            </p>

            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
              <button
                onClick={() => router.push("?tab=login", { scroll: false })}
                style={{
                  fontSize: 14,
                  fontWeight: currentTab === "login" ? 700 : 500,
                  color: currentTab === "login" ? "#0f172a" : "#94a3b8",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  borderBottom:
                    currentTab === "login"
                      ? "2px solid #0f172a"
                      : "2px solid transparent",
                }}>
                Log in
              </button>
              <span style={{ color: "#e2e8f0", alignSelf: "center" }}>·</span>
              <button
                onClick={() => router.push("?tab=signup", { scroll: false })}
                style={{
                  fontSize: 14,
                  fontWeight: currentTab === "signup" ? 700 : 500,
                  color: currentTab === "signup" ? "#0f172a" : "#94a3b8",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  borderBottom:
                    currentTab === "signup"
                      ? "2px solid #0f172a"
                      : "2px solid transparent",
                }}>
                Sign up
              </button>
            </div>

            {/* Form content */}
            {currentTab === "login" ? <LoginPage /> : <AuthSelectionPage />}
          </div>
        </div>

        {/* Bottom link */}
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <span style={{ fontSize: 14, color: "#64748b" }}>
            Have a business account?{" "}
          </span>
          <a
            href="/business-login"
            style={{
              fontSize: 14,
              color: "#3b82f6",
              fontWeight: 600,
              textDecoration: "none",
            }}>
            Go to WH Australia for professionals
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
