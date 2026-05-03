"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );
  const [intentId, setIntentId] = useState<string | null>(null);

  useEffect(() => {
    const paymentIntentStatus = searchParams.get("redirect_status");
    const id = searchParams.get("payment_intent");
    setTimeout(() => {
      setIntentId(id);
      setStatus(paymentIntentStatus === "succeeded" ? "success" : "failed");
    }, 0);
  }, [searchParams]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {status === "loading" && <p>Verifying payment…</p>}

        {status === "success" && (
          <>
            <div style={styles.icon}>✅</div>
            <h1 style={styles.title}>Payment Successful!</h1>
            <p style={styles.subtitle}>
              Thank you for your purchase. A confirmation email has been sent.
            </p>
            {intentId && (
              <p style={styles.id}>
                Reference: <strong>{intentId}</strong>
              </p>
            )}
          </>
        )}

        {status === "failed" && (
          <>
            <div style={styles.icon}>❌</div>
            <h1 style={{ ...styles.title, color: "#dc2626" }}>
              Payment Failed
            </h1>
            <p style={styles.subtitle}>
              Something went wrong. Please try again.
            </p>
          </>
        )}

        <Link href="/checkout" style={styles.button}>
          {status === "success" ? "Back to Home" : "Try Again"}
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "48px 40px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
  },
  icon: { fontSize: "56px", marginBottom: "16px" },
  title: {
    margin: "0 0 8px",
    fontSize: "26px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  subtitle: { margin: "0 0 20px", fontSize: "15px", color: "#666" },
  id: { fontSize: "12px", color: "#999", marginBottom: "24px" },
  button: {
    display: "inline-block",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    borderRadius: "10px",
    padding: "12px 28px",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "15px",
  },
};
