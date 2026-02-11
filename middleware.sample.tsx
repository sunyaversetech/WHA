import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const publicPaths = [
      "/login",
      "/register",
      "/verify-email",
      "/select-category",
    ];

    const isAuthRoute = pathname.startsWith("/auth");
    const isApiAuthRoute = pathname.startsWith("/api/auth");

    if (isAuthRoute || isApiAuthRoute) {
      return NextResponse.next();
    }

    if (publicPaths.includes(pathname)) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.next();
    }

    const isVerified = token.emailVerified && token.emailVerified !== "none";

    const hasCategory = token.category && token.category !== "none";

    // 🔐 Email verification gate
    if (!isVerified && pathname !== "/verify-email") {
      return NextResponse.redirect(new URL("/verify-email", req.url));
    }

    // 📂 Category selection gate
    if (isVerified && !hasCategory && pathname !== "/select-category") {
      return NextResponse.redirect(new URL("/select-category", req.url));
    }

    // 🚫 Prevent returning to setup pages
    if (isVerified && pathname === "/verify-email") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (hasCategory && pathname === "/select-category") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
