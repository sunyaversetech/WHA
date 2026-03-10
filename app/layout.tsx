import { type Metadata } from "next";

import { Roboto } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/Auth/SessionWrapper";
import ReactQueryContext from "@/lib/ReactQueryContext";
import { CityFilterProvider } from "@/contexts/city-filter-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { RedeemProvider } from "@/contexts/redeem-context";
import { Toaster } from "sonner";
import BottomNav from "@/components/ResuableComponents/BottomNavbar";
import NavbarProvider from "@/components/ResuableComponents/NavbarProvider";

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  weight: ["100", "300", "400", "500", "700", "900"], // Roboto available weights
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
      <body className={`${roboto.variable} antialiased `}>
        <ReactQueryContext>
          <RedeemProvider>
            <FavoritesProvider>
              <CityFilterProvider>
                <SessionWrapper>
                  <NavbarProvider />
                  <div>{children}</div>
                  <Toaster />
                  <BottomNav />
                </SessionWrapper>
              </CityFilterProvider>
            </FavoritesProvider>
          </RedeemProvider>
        </ReactQueryContext>
      </body>
    </html>
  );
}
