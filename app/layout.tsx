import { type Metadata } from "next";

import { Inter, Quicksand } from "next/font/google";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/SEO/JsonLd";
import "./globals.css";
import SessionWrapper from "@/components/Auth/SessionWrapper";
import ReactQueryContext from "@/lib/ReactQueryContext";
import { CityFilterProvider } from "@/contexts/city-filter-context";
import { Toaster } from "sonner";
import BottomNav from "@/components/ResuableComponents/BottomNavbar";
import NavbarProvider from "@/components/ResuableComponents/NavbarProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthModal } from "@/components/Auth/DialogLogin/AuthModel";

/* Brand fonts:
   Quicksand — headings, nav, buttons (friendly & rounded)
   Inter      — body text, data, forms (legible & neutral) */
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const DEFAULT_DESCRIPTION =
  "Discover events, local businesses, deals, and community news across Australia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
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
        className={`${quicksand.variable} ${inter.variable} ${quicksand.className} antialiased bg-background overflow-y-scroll overflow-x-hidden`}
      >
        <JsonLd data={ORGANIZATION_JSON_LD} />
        <JsonLd data={WEBSITE_JSON_LD} />
        <ReactQueryContext>
          <CityFilterProvider>
            <SessionWrapper>
              <NavbarProvider />
              <TooltipProvider>
                <div className="pb-16 md:pb-0">{children}</div>
                <AuthModal />
              </TooltipProvider>
              <Toaster />
              <BottomNav />
            </SessionWrapper>
          </CityFilterProvider>
        </ReactQueryContext>
      </body>
    </html>
  );
}
