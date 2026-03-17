import { type Metadata } from "next";

import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/Auth/SessionWrapper";
import ReactQueryContext from "@/lib/ReactQueryContext";
import { CityFilterProvider } from "@/contexts/city-filter-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { RedeemProvider } from "@/contexts/redeem-context";
import { Toaster } from "sonner";
import BottomNav from "@/components/ResuableComponents/BottomNavbar";
import NavbarProvider from "@/components/ResuableComponents/NavbarProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Whats Happening Australia",
  description: "Events, Deals, Local Businesses, and Community News",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ReactQueryContext>
          <CityFilterProvider>
            <SessionWrapper>
              <NavbarProvider />
              <TooltipProvider>
                <div>{children}</div>
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
