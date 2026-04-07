"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSendVerificationEmail } from "@/services/email.service";
import { useEffect, useRef } from "react";

export default function SendEmailPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { mutate } = useSendVerificationEmail();

  const hasSent = useRef(false);

  useEffect(() => {
    if (!hasSent.current && session?.user?.email) {
      mutate({ email: session.user.email });
      hasSent.current = true;
    }
  }, [session?.user?.email]);

  const handleResend = () => {
    hasSent.current = false; // reset the guard
    if (session?.user?.email) {
      mutate({ email: session.user.email });
      hasSent.current = true;
    }
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
        <Button onClick={() => router.push("/dashboard")}>
          I`ve Verified My Email
        </Button>
        <Button variant="outline" onClick={handleResend}>
          Resend Email
        </Button>
      </div>
    </div>
  );
}
