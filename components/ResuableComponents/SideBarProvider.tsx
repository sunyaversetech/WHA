"use client";
import { useSession } from "next-auth/react";
import UserSidebar from "./User-Sidebar";
import Sidebar from "./Sidebar";

const SideBarProvider = () => {
  const { data: session } = useSession();
  return (
    <>{session?.user.category === "user" ? <UserSidebar /> : <Sidebar />}</>
  );
};

export default SideBarProvider;
