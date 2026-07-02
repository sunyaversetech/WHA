"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, MoveLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

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
      className="justify-between w-full mt-15 sm:mt-0 sm:min-h-[100vh]"
      style={{
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
      <div className="m-auto" style={{ width: "100%", maxWidth: 400 }}>
        {/* Back button */}
        <Button
          variant={"ghost"}
          className="cursor-pointer w-10 h-10 absolute top-10 left-2 sm:left-10 rounded-full!"
          onClick={() => router.push(backHref)}>
          <MoveLeft className="cursor-pointer" />
        </Button>

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
