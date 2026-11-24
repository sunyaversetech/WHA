"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingPage from "@/components/ResuableComponents/Loading";

// Routes whose content must never flash to a logged-out visitor before the
// session resolves. Everywhere else, gating on session status blocked every
// page's server-rendered HTML behind a loading screen (crawlers, including
// AI crawlers, saw nothing but "Loading Your Content") for content that was
// never actually session-dependent.
const PRIVATE_PREFIXES = ["/dashboard", "/super-admin", "/activity", "/favorites"];

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const userCategory = (session?.user as { category?: string })?.category;

  const router = useRouter();
  const pathname = usePathname();
  const isPrivateRoute = PRIVATE_PREFIXES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (!pathname) return;
    if (status === "unauthenticated" && pathname.startsWith("/dashboard")) {
      router.push("/auth");
    }

    if (status === "authenticated" && pathname.startsWith("/auth")) {
      router.push("/dashboard");
    }

    if (
      status === "authenticated" &&
      userCategory === "none" &&
      pathname !== "/dashboard/complete-profile"
    ) {
      router.push("/dashboard/complete-profile");
    }
  }, [status, pathname, router, session, userCategory]);

  if (status === "loading" && isPrivateRoute) {
    return <LoadingPage />;
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
