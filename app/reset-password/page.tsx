"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const code = searchParams.get("code");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return alert("Passwords do not match");

    const res = await fetch("/api/auth/update-password", {
      method: "POST",
      body: JSON.stringify({ email, code, password }),
    });
    if (res.ok) {
      alert("Success! Redirecting to login...");
      router.push("/login");
    }
  };

  return (
    <form
      onSubmit={handleUpdate}
      className="max-w-md mx-auto mt-20 p-6 border rounded-xl">
      <h1 className="text-2xl font-bold mb-4">New Password</h1>
      <input
        type="password"
        placeholder="New Password"
        className="w-full p-2 border rounded mb-4"
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        className="w-full p-2 border rounded mb-4"
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button className="w-full bg-black text-white p-2 rounded">
        Update Password
      </button>
    </form>
  );
}
