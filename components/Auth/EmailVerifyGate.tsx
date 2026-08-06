"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  useSendSignupCode,
  useVerifySignupCode,
} from "@/services/Auth/email-verification.service";

function apiErrorMessage(error: any, fallback: string): string {
  try {
    const parsed = JSON.parse(error?.message ?? "");
    return parsed?.message || fallback;
  } catch {
    return error?.message || fallback;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailVerifyGate({
  email,
  verified,
  onVerified,
}: {
  email: string;
  verified: boolean;
  onVerified: (verified: boolean) => void;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const { mutate: sendCode, isPending: sending } = useSendSignupCode();
  const { mutate: verifyCode, isPending: verifying } = useVerifySignupCode();

  const emailValid = EMAIL_RE.test(email);

  const handleSend = () => {
    if (!emailValid) return;
    sendCode(
      { email },
      {
        onSuccess: () => {
          setSent(true);
          setCode("");
          toast.success("Verification code sent to your email");
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Failed to send verification code"));
        },
      },
    );
  };

  const handleVerify = () => {
    if (code.trim().length !== 6) return;
    verifyCode(
      { email, code: code.trim() },
      {
        onSuccess: () => {
          onVerified(true);
          toast.success("Email verified");
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Incorrect code"));
        },
      },
    );
  };

  if (verified) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 mt-1.5">
        <CheckCircle2 size={15} />
        Email verified
      </div>
    );
  }

  if (!sent) {
    return (
      <button
        type="button"
        onClick={handleSend}
        disabled={!emailValid || sending}
        className="mt-1.5 text-sm font-semibold text-primary hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed flex items-center gap-1.5">
        {sending && <Loader2 size={13} className="animate-spin" />}
        Verify this email
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="6-digit code"
        inputMode="numeric"
        className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm tracking-widest outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={handleVerify}
        disabled={code.length !== 6 || verifying}
        className="text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
        {verifying && <Loader2 size={13} className="animate-spin" />}
        Confirm
      </button>
      <button
        type="button"
        onClick={handleSend}
        disabled={sending}
        className="text-sm font-medium text-slate-400 hover:text-slate-600">
        Resend
      </button>
    </div>
  );
}
