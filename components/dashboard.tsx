"use client";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Image from "next/image";

export default function Dashboard() {
  const { data: session, status } = useSession();

  console.log("session", session);

  if (status === "unauthenticated") return <p>Access Denied. Please Login.</p>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Welcome, {session?.user.name}</h1>
      <Avatar>
        <AvatarImage
          src={session?.user.image ?? ""}
          alt={`WhatsHappeningAustralia-${session?.user.name}`}
        />
        <AvatarFallback>
          {session?.user.name && session?.user.name[0]}
        </AvatarFallback>
      </Avatar>
      <p>Email: {session?.user?.email}</p>
      <button
        onClick={() => signOut()}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Sign Out
      </button>
    </div>
  );
}
