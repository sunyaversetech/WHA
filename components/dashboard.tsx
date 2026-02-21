"use client";
import { useSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const businessName = (session?.user as { business_name?: string })
    ?.business_name;

  if (status === "unauthenticated") return <p>Access Denied. Please Login.</p>;

  return (
    <div className="p-10">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Welcome, {session?.user.name}</h1>
        <h1 className="text-2xl font-bold">{businessName}</h1>
      </div>
      <p>Email: {session?.user?.email}</p>
      <button
        onClick={() => signOut()}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Sign Out
      </button>
    </div>
  );
}
