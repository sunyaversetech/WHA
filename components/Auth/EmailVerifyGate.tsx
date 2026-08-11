"use client";

import { useEffect, useState } from "react";
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
  const [cooldown, setCooldown] = useState(0);
  const { mutate: sendCode, isPending: sending } = useSendSignupCode();
  const { mutate: verifyCode, isPending: verifying } = useVerifySignupCode();

  const emailValid = EMAIL_RE.test(email);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSend = () => {
    if (!emailValid) return;
    sendCode(
      { email },
      {
        onSuccess: () => {
          setSent(true);
          setCode("");
          setCooldown(60);
          toast.success("Verification code sent to your email");
        },
        onError: (error) => {
          toast.error(
            apiErrorMessage(error, "Failed to send verification code"),
          );
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
        style={{
          width: "100%",
          background: sending ? "#334155" : "#0f172a",
          color: "#fff",
          border: "none",
          borderRadius: 9999,
          padding: "16px",
          fontSize: 16,
          fontWeight: 700,
          cursor: sending ? "not-allowed" : "pointer",
          transition: "background .15s",
        }}>
        {sending && <Loader2 size={13} className="animate-spin" />}
        Verify this email
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="6-digit code"
        inputMode="numeric"
        className="w-full border focus-within:ring-0 focus-within:ring-offset-0 focus-within:outline-none  border-slate-200 rounded-lg px-3 py-2 text-sm tracking-widest outline-none focus:border-primary"
      />
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={handleVerify}
          disabled={code.length !== 6 || verifying}
          className="text-sm w-full font-semibold px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
          {verifying && <Loader2 size={13} className="animate-spin" />}
          Confirm
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || cooldown > 0}
          className="text-sm font-medium w-full text-slate-400 hover:text-slate-600 disabled:hover:text-slate-400 disabled:cursor-not-allowed">
          {cooldown > 0 ? `${cooldown}s` : "Resend"}
        </button>
      </div>
    </div>
  );
}
