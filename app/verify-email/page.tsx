"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const handleRefresh = async () => {
    await update();
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Verify Your Email</h1>
      <p className="text-gray-600 mb-6">
        We`ve sent a verification link to{" "}
        <strong>{session?.user?.email}</strong>. Please verify your email to
        continue setting up your profile.
      </p>
      <div className="space-y-4">
        <Button onClick={handleRefresh}>I`ve Verified My Email</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Resend Email
        </Button>
      </div>
    </div>
  );
}
