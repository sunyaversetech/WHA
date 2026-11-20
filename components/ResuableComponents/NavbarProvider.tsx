"use client";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navabr";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";

const NavbarProvider = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/auth")) return null;

  return (
    <>
      {pathname.startsWith("/dashboard") ||
      pathname.startsWith("/super-admin") ? (
        <DashboardNavbar />
      ) : (
        // Navbar reads useSearchParams() (for ?city=) - Next.js requires a
        // Suspense boundary around any client component that does, so a
        // statically-prerenderable route (like the built-in /_not-found)
        // doesn't fail the build over it.
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
      )}
    </>
  );
};

export default NavbarProvider;
