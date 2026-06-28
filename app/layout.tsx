import { type Metadata } from "next";

import { Inter, Quicksand } from "next/font/google";
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

export const metadata: Metadata = {
  title: "What's Happening Australia",
  description:
    "Discover events, local businesses, deals, and community news across Australia.",
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
