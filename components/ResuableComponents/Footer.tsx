"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Dashboard/auth/super-admin have their own fixed-height app shells —
  // a trailing footer there would sit under the fold or break the layout.
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/super-admin")
  )
    return null;

  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      <p>
        &copy; {new Date().getFullYear()}{" "}
        <a
          href="https://sunyaverse.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:text-foreground hover:underline"
        >
          Sunyaverse
        </a>
        . All rights reserved.
      </p>
    </footer>
  );
}
