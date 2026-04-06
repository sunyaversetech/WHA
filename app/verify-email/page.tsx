"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your email...");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token found.");
        return;
      }
      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(
            "Your email has been verified! Redirecting to dashboard...",
          );
          window.location.href = "/dashboard";
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>

        {status === "loading" && (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        )}

        <p
          className={`mt-4 ${status === "error" ? "text-red-500" : "text-gray-600"}`}>
          {message}
        </p>

        {status !== "loading" && (
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
