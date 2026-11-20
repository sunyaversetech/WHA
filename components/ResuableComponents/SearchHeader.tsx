"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu as MenuIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import FreshaSearchBar from "./FreshaSearchBar";

// Desktop (>=1024px) header — fresha-search-kit/spec/04 "Header". The one
// header component every non-dashboard page renders (via Navabr.tsx), so
// /search and every detail page show the exact same bar.
export default function SearchHeader() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    margin: "0 -12px",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "20px",
    color: "inherit",
    textDecoration: "none",
  };

  return (
    <header
      data-ui="header"
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        height: 72,
        padding: "12px 32px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--background)",
      }}>
      <Link
        href="/"
        aria-label="What's Happening Australia — home"
        data-ui="header-logo"
        style={{ display: "flex", alignItems: "center", height: 48, position: "relative", zIndex: 1 }}>
        <Image
          data-ui="header-logo-img"
          src="/wha/logo.png"
          alt="What's Happening Australia"
          width={149}
          height={40}
          priority
          style={{ height: 40, width: "auto", display: "block" }}
        />
      </Link>

      <FreshaSearchBar />

      <div ref={menuRef} style={{ position: "relative", zIndex: 1 }}>
        <button
          data-ui="header-menu-button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 48,
            padding: "0 19px",
            border: "1px solid var(--border-strong)",
            borderRadius: 9999,
            background: "var(--background)",
            fontSize: 16,
            fontWeight: 600,
            lineHeight: "22px",
            letterSpacing: "-0.1px",
            cursor: "pointer",
          }}>
          Menu
          <MenuIcon size={24} strokeWidth={1.75} style={{ margin: "0 -4px 0 -2px" }} />
        </button>

        {menuOpen && (
          <div
            data-ui="menu-dropdown"
            role="menu"
            style={{
              position: "fixed",
              top: 68,
              right: 32,
              width: 240,
              minWidth: 200,
              padding: "8px 20px",
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "var(--background)",
              boxShadow: "var(--shadow-elevated)",
              zIndex: 100000,
            }}>
            <span
              data-ui="menu-dropdown-heading"
              style={{ display: "block", padding: "8px 0 4px", fontSize: 19, fontWeight: 600, lineHeight: "24px", letterSpacing: "-0.2px" }}>
              For customers
            </span>
            {session ? (
              <>
                <Link
                  href={session.user?.category === "business" ? "/dashboard/calendar" : "/dashboard"}
                  data-ui="menu-dropdown-item"
                  style={itemStyle}
                  onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/activity" data-ui="menu-dropdown-item" style={itemStyle} onClick={() => setMenuOpen(false)}>
                  My activity
                </Link>
              </>
            ) : (
              <Link
                href="/auth"
                data-ui="menu-dropdown-item"
                style={{ ...itemStyle, color: "var(--secondary)" }}
                onClick={() => setMenuOpen(false)}>
                Log in or sign up
              </Link>
            )}
            <hr style={{ border: 0, height: 1, background: "var(--foreground)", opacity: 0.1, margin: "8px 0" }} />
            <Link
              href="/auth/business/login"
              data-ui="menu-dropdown-item"
              style={{ ...itemStyle, fontWeight: 600, justifyContent: "space-between" }}
              onClick={() => setMenuOpen(false)}>
              For businesses
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
