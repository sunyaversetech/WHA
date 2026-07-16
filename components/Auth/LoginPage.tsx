"use client";

import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.email().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const INPUT_WRAP: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 16,
};
const LABEL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};
export const INPUT: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10,
  padding: "14px 16px",
  fontSize: 16,
  color: "#0f172a",
  outline: "none",
  boxShadow: "none",
  background: "#fff",
  boxSizing: "border-box",
  transition: "border-color .15s",
  WebkitAppearance: "none",
};

export default function LoginPage({
  showGoogle = true,
  signupHref,
  loginType = "user",
}: {
  showGoogle?: boolean;
  signupHref?: string;
  loginType?: "user" | "business";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const result = await signIn(`${loginType}-credentials`, {
      email: values.email.toLowerCase().trim(),
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(
        result.status === 401
          ? "Invalid email or password. Please try again."
          : "An error occurred during login. Please try again later.",
      );
      setLoading(false);
    } else if (result?.ok) {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      router.push(
        session?.user?.category === "super-admin"
          ? "/super-admin"
          : "/dashboard",
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Email */}
      <div style={INPUT_WRAP}>
        <label style={LABEL}>Email</label>
        <input
          {...register("email")}
          type="email"
          placeholder="your@email.com"
          style={INPUT}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        />
        {errors.email && (
          <span style={{ fontSize: 13, color: "#ef4444" }}>
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Password */}
      <div style={{ ...INPUT_WRAP, marginBottom: 8 }}>
        <label style={LABEL}>Password</label>
        <div style={{ position: "relative" }}>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            style={{ ...INPUT, paddingRight: 48 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0f172a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
            }}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <span style={{ fontSize: 13, color: "#ef4444" }}>
            {errors.password.message}
          </span>
        )}
      </div>

      {/* Forgot password */}
      <div style={{ textAlign: "right", marginBottom: 24 }}>
        <a
          href="/forgot-password"
          style={{
            fontSize: 13,
            color: "#3b82f6",
            fontWeight: 500,
            textDecoration: "none",
          }}>
          Forgot password?
        </a>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          background: loading ? "#334155" : "#0f172a",
          color: "#fff",
          border: "none",
          borderRadius: 9999,
          padding: "16px",
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: signupHref ? 16 : 24,
          transition: "background .15s",
        }}>
        {loading ? "Signing in…" : "Continue"}
      </button>

      {/* Don't have an account? */}
      {signupHref && (
        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "#64748b",
            margin: "0 0 24px",
          }}>
          Don&apos;t have an account?{" "}
          <Link
            href={signupHref}
            style={{
              color: "#0f172a",
              fontWeight: 700,
              textDecoration: "none",
            }}>
            Sign up
          </Link>
        </p>
      )}

      {/* Google — only shown when enabled */}
      {showGoogle && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              border: "1.5px solid #e2e8f0",
              borderRadius: 9999,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 600,
              color: "#0f172a",
              background: "#fff",
              cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
            <svg width={20} height={20} viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Continue with Google
          </button>
        </>
      )}
    </form>
  );
}
