"use client";
import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-black text-slate-800 tracking-tight">
          Rent<span className="text-orange-500">Works</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link
            href="#features"
            className="hover:text-orange-500 transition-colors">
            Features
          </Link>
          <Link
            href="#pricing"
            className="hover:text-orange-500 transition-colors">
            Pricing
          </Link>
          <Link
            href="#blog"
            className="hover:text-orange-500 transition-colors">
            Blog
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="font-bold text-slate-600 hover:text-orange-500">
                Login
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-6 shadow-lg shadow-orange-200 transition-all active:scale-95">
                Sign Up
              </Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-orange-200 text-orange-600 font-bold rounded-full">
                  Dashboard
                </Button>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 border-2 border-orange-100",
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
