import { type Metadata } from "next";

import { Marcellus, Montserrat } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/Auth/SessionWrapper";
import ReactQueryContext from "@/lib/ReactQueryContext";
import { CityFilterProvider } from "@/contexts/city-filter-context";
import { Toaster } from "sonner";
import BottomNav from "@/components/ResuableComponents/BottomNavbar";
import NavbarProvider from "@/components/ResuableComponents/NavbarProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-marcellus",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
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
      <body
        className={`${marcellus.variable} ${montserrat.variable} font-montserrat antialiased bg-neutral-50 overflow-scroll no-scrollbar`}>
        <ReactQueryContext>
          <CityFilterProvider>
            <SessionWrapper>
              <NavbarProvider />
              <TooltipProvider>
                <div className="pb-16 md:pb-0">{children}</div>
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
