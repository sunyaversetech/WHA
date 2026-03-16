"use client";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import Navbar from "./Navabr";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";

const NavbarProvider = () => {
  const pathname = usePathname();
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
