// app/dashboard/page.tsx
"use client";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Dashboard() {
  const { data: session, status } = useSession();

  console.log("session", session);

  if (status === "unauthenticated") return <p>Access Denied. Please Login.</p>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Welcome, {session?.user.name}</h1>
      <Image
        src={session?.user.image ?? ""}
        alt="Profile"
        className="rounded-full"
        width={100}
        height={100}
      />
      <p>Email: {session?.user?.email}</p>
      <button
        onClick={() => signOut()}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Sign Out
      </button>
    </div>
  );
}
