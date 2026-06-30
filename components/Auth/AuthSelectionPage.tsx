"use client";

import { useRouter } from "next/navigation";

const CARD: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #e2e8f0",
  borderRadius: 14,
  padding: "20px 22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  background: "#fff",
  textAlign: "left",
  transition: "border-color .15s, box-shadow .15s",
};

function SelectCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={CARD}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#0f172a";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(15,23,42,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.boxShadow = "none";
      }}>
      <div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 4,
          }}>
          {title}
        </div>
        <div style={{ fontSize: 14, color: "#64748b" }}>{subtitle}</div>
      </div>
      {/* Chevron */}
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}>
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

export default function AuthSelectionPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SelectCard
        title="WHA for customers"
        subtitle="Discover local events and book services near you"
        onClick={() => router.push("/auth/user")}
      />
      <SelectCard
        title="WHA for businesses"
        subtitle="Promote and grow your business with WH Australia"
        onClick={() => router.push("/auth/business")}
      />
      {/* OR divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "4px 0",
        }}>
        {/* <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
          OR
        </span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} /> */}
      </div>
      {/* Google */}
      {/* <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          border: "1.5px solid #e2e8f0",
          borderRadius: 9999,
          padding: "14px 20px",
          fontSize: 15,
          fontWeight: 600,
          color: "#0f172a",
          background: "#fff",
          cursor: "pointer",
          transition: "background .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
        <svg width={20} height={20} viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
          />
        </svg>
        Continue with Google
      </button> */}
    </div>
  );
}
