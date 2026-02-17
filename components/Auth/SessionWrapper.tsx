"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const userCategory = (session?.user as { category?: string })?.category;
  const router = useRouter();
  const pathname = usePathname();
  console.log("session", session);

  useEffect(() => {
    if (!pathname) return;
    if (status === "unauthenticated" && pathname.startsWith("/dashboard")) {
      router.push("/auth");
    }

    if (
      status === "authenticated" &&
      userCategory === "none" &&
      pathname !== "/dashboard/complete-profile"
    ) {
      router.push("/dashboard/complete-profile");
    }
  }, [status, pathname, router, session]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
};
const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
};

export default SessionWrapper;
