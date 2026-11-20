import { type Metadata } from "next";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";

import { Hanken_Grotesk } from "next/font/google";
import { SITE_URL, SITE_NAME } from "@/lib/seo";
import JsonLd from "@/components/SEO/JsonLd";
import "./globals.css";
import SessionWrapper from "@/components/Auth/SessionWrapper";
import ReactQueryContext from "@/lib/ReactQueryContext";
import { CityFilterProvider } from "@/contexts/city-filter-context";
import { Toaster } from "sonner";
import BottomNav from "@/components/ResuableComponents/BottomNavbar";
import Footer from "@/components/ResuableComponents/Footer";
import NavbarProvider from "@/components/ResuableComponents/NavbarProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthModalLoader from "@/components/Auth/DialogLogin/AuthModalLoader";

// Single UI font for everything — headings, body, nav, buttons — matching
// Fresha's one-family approach (their app uses Aktiv Grotesk, a commercial
// font; Hanken Grotesk is the closest freely-licensed equivalent).
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

// Deliberately just metadataBase + icons here. Every other field (title,
// description, alternates, openGraph, twitter) used to default to the
// homepage's here and get inherited by any page that didn't override it -
// and because a page-level openGraph/twitter replaces the parent's wholesale
// rather than merging, even pages that DID override their title/canonical
// kept shipping the homepage's og:title/og:url. Every static page now
// builds its own complete metadata via lib/seo.ts's buildMetadata().
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/wha/logo2.png`,
  sameAs: [
    "https://www.instagram.com/whatshappening_australia",
    "https://www.facebook.com/whatshappeningaustralia",
  ],
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        data-ui="page-root"
        className={`${hankenGrotesk.variable} ${hankenGrotesk.className} antialiased bg-background overflow-y-scroll overflow-x-hidden`}>
        <NextTopLoader color="var(--primary)" showSpinner={false} height={3} />
        <JsonLd data={ORGANIZATION_JSON_LD} />
        <JsonLd data={WEBSITE_JSON_LD} />
        <ReactQueryContext>
          <CityFilterProvider>
            <SessionWrapper>
              <NavbarProvider />
              <TooltipProvider>
                <div className="pb-16 md:pb-0">
                  {children}
                  <Footer />
                </div>
                <AuthModalLoader />
              </TooltipProvider>
              <Toaster />
              {/* BottomNav reads useSearchParams() (for ?city=) - same
                 Suspense requirement as Navbar, see NavbarProvider.tsx. */}
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            </SessionWrapper>
          </CityFilterProvider>
        </ReactQueryContext>
      </body>
    </html>
  );
}
