"use client";

import { useRouter } from "next/navigation";
import { Users, Briefcase, ChevronRight, MoveLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

export default function AuthChoicePage() {
  const router = useRouter();

  return (
    <div
      className="justify-between md:h-[80vh] sm:h-screen w-full overflow-hidden mt-10 sm:mt-0 md:items-center"
      style={{
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        padding: "48px 24px",
      }}>
      <Button
        variant={"ghost"}
        className="cursor-pointer absolute top-10 left-2 sm:left-10 "
        onClick={() => router.push("/")}>
        <MoveLeft className="cursor-pointer" />
      </Button>
      <div className="md:m-auto">
        {/* Brand */}
        <div
          onClick={() => router.push("/")}
          style={{
            marginBottom: 48,
            textAlign: "center",
            alignItems: "center",
          }}>
          <Image
            src="/wha/logo.png"
            alt="logowha"
            width={104}
            height={28}
            className="m-auto mb-2"
          />
          {/* <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 8px",
              letterSpacing: "-0.3px",
            }}>
            WH Australia
          </h1> */}
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            How would you like to continue?
          </p>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
            maxWidth: 400,
          }}>
          <ChoiceCard
            icon={<Users size={26} strokeWidth={1.6} />}
            title="WHA for Customers"
            description="Book services, manage appointments and discover local businesses."
            accent="#0f172a"
            onClick={() => router.push("/auth/user/login")}
          />
          <ChoiceCard
            icon={<Briefcase size={26} strokeWidth={1.6} />}
            title="WHA for Business"
            description="List your services, manage bookings and grow your customer base."
            accent="#7c3aed"
            onClick={() => router.push("/auth/business/login")}
          />
        </div>
      </div>

      <div
        className="hidden md:block"
        style={{
          width: "46%",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          right: 0,
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

function ChoiceCard({
  icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        border: "1.5px solid #e2e8f0",
        borderRadius: 16,
        padding: "24px",
        background: "#fff",
        cursor: "pointer",
        transition: "border-color .15s, box-shadow .15s",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.boxShadow = "none";
      }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background:
            accent === "#7c3aed" ? "rgba(124,58,237,0.08)" : "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent,
          flexShrink: 0,
        }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 4px",
          }}>
          {title}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.5,
          }}>
          {description}
        </p>
      </div>
      <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
    </button>
  );
}
