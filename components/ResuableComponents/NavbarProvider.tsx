"use client";
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
        <Navbar />
      )}
    </>
  );
};

export default NavbarProvider;
