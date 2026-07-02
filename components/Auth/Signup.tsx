"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSingup } from "@/services/Auth/auth.service";
import { useState } from "react";
import { ChevronLeft, Eye, EyeOff, MoveLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.email().min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    cpassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
    category: z.enum(["user", "business"]),
    accpetalltermsandcondition: z.boolean().refine((v) => v === true, {
      message: "You must accept the Terms of Service",
    }),
  })
  .refine((d) => d.password === d.cpassword, {
    message: "Passwords don't match",
    path: ["cpassword"],
  });

const INPUT_WRAP: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 14,
};
const LABEL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0f172a",
};
const INPUT: React.CSSProperties = {
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
const ERR: React.CSSProperties = { fontSize: 13, color: "#ef4444" };

export default function SignupPage() {
  const router = useRouter();
  const { mutate, isPending } = useSingup();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      cpassword: "",
      category: "user",
      accpetalltermsandcondition: false,
    },
  });

  const onSubmit = (values: z.infer<typeof signupSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });
    mutate(formData as any, {
      onSuccess: () => {
        toast.success("Account created! Please log in.");
        router.replace("/auth?tab=login");
      },
      onError: (error: any) => {
        toast.error(error.message || "Signup failed. Please try again.");
      },
    });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0 24px",
          overflowY: "auto",
        }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Button
            variant={"ghost"}
            className="cursor-pointer w-10 h-10 absolute top-10 left-2 sm:left-10 rounded-full!"
            onClick={() => router.push("/auth/user/login")}>
            <MoveLeft className="cursor-pointer" />
          </Button>
          <div style={{ width: "100%", maxWidth: 400 }}>
            <div style={{ marginBottom: 24 }}></div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}>
              Signup as customers
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                margin: "0 0 32px",
                lineHeight: 1.5,
              }}>
              Create an account to discover local events and book services near
              you.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Full name */}
              <div style={INPUT_WRAP}>
                <label style={LABEL}>Full name</label>
                <input
                  {...register("name")}
                  placeholder="Jane Smith"
                  style={INPUT}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#0f172a")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                />
                {errors.name && <span style={ERR}>{errors.name.message}</span>}
              </div>

              {/* Email */}
              <div style={INPUT_WRAP}>
                <label style={LABEL}>Email</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="your@email.com"
                  style={INPUT}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#0f172a")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e2e8f0")
                  }
                />
                {errors.email && (
                  <span style={ERR}>{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div style={INPUT_WRAP}>
                <label style={LABEL}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    style={{ ...INPUT, paddingRight: 48 }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#0f172a")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#e2e8f0")
                    }
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
                  <span style={ERR}>{errors.password.message}</span>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ ...INPUT_WRAP, marginBottom: 18 }}>
                <label style={LABEL}>Confirm password</label>
                <div style={{ position: "relative" }}>
                  <input
                    {...register("cpassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    style={{ ...INPUT, paddingRight: 48 }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "#0f172a")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "#e2e8f0")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
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
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.cpassword && (
                  <span style={ERR}>{errors.cpassword.message}</span>
                )}
              </div>

              {/* Terms */}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 22,
                  cursor: "pointer",
                }}>
                <input
                  {...register("accpetalltermsandcondition")}
                  type="checkbox"
                  style={{
                    width: 16,
                    height: 16,
                    marginTop: 2,
                    accentColor: "#0f172a",
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                />
                <span
                  style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                  I agree to the{" "}
                  <Link
                    href="/privacy"
                    style={{
                      color: "#3b82f6",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}>
                    Privacy Policy
                  </Link>
                  ,{" "}
                  <Link
                    href="/privacy"
                    style={{
                      color: "#3b82f6",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    style={{
                      color: "#3b82f6",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}>
                    Terms of Business
                  </Link>
                </span>
              </label>
              {errors.accpetalltermsandcondition && (
                <p style={{ ...ERR, marginTop: -16, marginBottom: 12 }}>
                  {errors.accpetalltermsandcondition.message}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                style={{
                  width: "100%",
                  background: isPending ? "#334155" : "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 9999,
                  padding: "16px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: isPending ? "not-allowed" : "pointer",
                  transition: "background .15s",
                }}>
                {isPending ? "Creating account…" : "Create account"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom link */}
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <span style={{ fontSize: 14, color: "#64748b" }}>
            Already have an account?{" "}
          </span>
          <Link
            href="/auth/user/login"
            style={{
              fontSize: 14,
              color: "#3b82f6",
              fontWeight: 600,
              textDecoration: "none",
            }}>
            Log in
          </Link>
        </div>
      </div>
      <div
        className="hidden md:block"
        style={{
          width: "46%",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          right: 0,
          height: "100vh",
        }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Image
            src="/wha/wha-auth.png"
            alt="WH Australia"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>
    </div>
  );
}
