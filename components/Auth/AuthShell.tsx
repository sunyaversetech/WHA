"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, MoveLeft } from "lucide-react";
import Image from "next/image";

export default function AuthShell({
  heading,
  subheading,
  backHref,
  children,
}: {
  heading: string;
  subheading: string;
  backHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div
      className="justify-between w-full"
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
      <div className="m-auto" style={{ width: "100%", maxWidth: 400 }}>
        {/* Back button */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.push(backHref)}
            className="absolute top-10 left-10"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}>
            <MoveLeft size={20} color="#0f172a" />
          </button>
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

        {children}
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
