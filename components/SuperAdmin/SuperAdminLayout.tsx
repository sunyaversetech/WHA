"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SuperAdminSidebar from "./Sidebar";

const SuperAdminLayoutContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.category !== "super-admin") {
      router.push("/unauthorized");
    }
  }, [pathname, session, router]);

  return (
    <>
      <div className="hidden md:flex h-screen ml-0 overflow-hidden bg-background ">
        <SuperAdminSidebar />

        <div className="flex flex-col flex-1 overflow-hidden ml-20 md:ml-56 mt-18  px-10 py-2 md:py-10">
          <main className="flex-1 overflow-y-auto ">{children}</main>
        </div>
      </div>

      <div className="md:hidden h-screen ml-0 overflow-hidden bg-[#f6f6f6] flex ">
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          <main className="flex-1 overflow-y-auto ">{children}</main>
        </div>
      </div>
    </>
  );
};

export default SuperAdminLayoutContent;
