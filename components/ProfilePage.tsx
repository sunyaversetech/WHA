"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { redirect } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading")
    return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-xl shadow-sm">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="space-y-4">
        <Image
          alt="Profile"
          width={96}
          height={96}
          src={session.user?.image || ""}
          className="w-24 h-24 rounded-full border-4 border-red-50"
        />
        <div>
          <label className="text-sm text-gray-500">Full Name</label>
          <p className="text-lg font-medium">{session.user?.name}</p>
        </div>
        <div>
          <label className="text-sm text-gray-500">Email Address</label>
          <p className="text-lg font-medium">{session.user?.email}</p>
        </div>
      </div>
    </div>
  );
}
